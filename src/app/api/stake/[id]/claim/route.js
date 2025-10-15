import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../../lib/session';
import { databaseHelpers } from '../../../../../lib/database';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get staking details
    const staking = await databaseHelpers.staking.getStakingById(id);
    if (!staking) {
      return NextResponse.json(
        { success: false, error: 'Staking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this staking
    if (staking.userId !== session.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if staking is completed
    if (staking.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Staking is not completed yet' },
        { status: 400 }
      );
    }

    // Check if already claimed
    if (staking.claimed) {
      return NextResponse.json(
        { success: false, error: 'Staking rewards already claimed' },
        { status: 400 }
      );
    }

    // Calculate reward amount and profit
    const rewardAmount = (staking.amountStaked * staking.rewardPercent) / 100;
    const profit = rewardAmount; // The profit is the reward amount
    const totalAmount = staking.amountStaked + rewardAmount;

    // Get current token value for inflation calculations
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    console.log('💰 Current token value calculation:', {
      baseValue: tokenValue.baseValue,
      totalSupply: tokenValue.totalSupply,
      userSupplyRemaining: tokenValue.userSupplyRemaining,
      inflationFactor: tokenValue.inflationFactor,
      currentTokenValue: tokenValue.currentTokenValue
    });

    // Get user's wallet
    const userWallet = await databaseHelpers.wallet.getWalletByUserId(session.id);
    if (!userWallet) {
      return NextResponse.json(
        { success: false, error: 'User wallet not found' },
        { status: 404 }
      );
    }

    // Get user details to check for referrer
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check token supply before processing
    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    if (!tokenSupply) {
      return NextResponse.json(
        { success: false, error: 'Token supply not initialized' },
        { status: 500 }
      );
    }

    // Calculate total tokens needed (profit + referral bonus if applicable)
    let totalTokensNeeded = profit;
    let referrerBonus = 0;
    
    if (user.referrerId) {
      referrerBonus = (profit * 10) / 100; // 10% of staking profit
      totalTokensNeeded += referrerBonus;
    }

    // Check if sufficient tokens are available
    if (Number(tokenSupply.userSupplyRemaining) < totalTokensNeeded) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient token supply',
          details: {
            required: totalTokensNeeded,
            available: Number(tokenSupply.userSupplyRemaining),
            shortfall: totalTokensNeeded - Number(tokenSupply.userSupplyRemaining),
            message: 'User supply limit reached. Admin needs to unlock tokens from reserve.'
          }
        },
        { status: 400 }
      );
    }

    // Start transaction for referral profit distribution
    let client;
    let referralEarning = null;
    let referrerWallet = null;
    let referrerNewBalance = null;
    let updatedTokenSupply = null;

    try {
      client = await databaseHelpers.pool.connect();
      await client.query('BEGIN');

      // Deduct tokens from supply first
      await client.query(`
        UPDATE token_supply 
        SET "userSupplyRemaining" = "userSupplyRemaining" - $1, "updatedAt" = NOW()
        WHERE id = $2
        RETURNING *
      `, [totalTokensNeeded, tokenSupply.id]);

      // Get updated token supply
      const updatedSupplyResult = await client.query(
        'SELECT * FROM token_supply WHERE id = $1',
        [tokenSupply.id]
      );
      updatedTokenSupply = updatedSupplyResult.rows[0];

      // Add staked amount + reward back to user's wallet
      const newTikiBalance = userWallet.tikiBalance + totalAmount;
      await client.query(
        'UPDATE wallets SET "tikiBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
        [newTikiBalance, session.id]
      );

      // Check if user has a referrer and distribute referral profit
      if (user.referrerId && referrerBonus > 0) {
        console.log('🔗 User has referrer, distributing referral profit...');
        
        // Get the referral record
        const referral = await client.query(
          'SELECT * FROM referrals WHERE "referrerId" = $1 AND "referredId" = $2',
          [user.referrerId, session.id]
        );

        if (referral.rows.length > 0) {
          const referralRecord = referral.rows[0];
          
          // Get referrer's wallet
          const referrerWalletResult = await client.query(
            'SELECT * FROM wallets WHERE "userId" = $1',
            [user.referrerId]
          );
          
          if (referrerWalletResult.rows.length > 0) {
            referrerWallet = referrerWalletResult.rows[0];
            referrerNewBalance = referrerWallet.tikiBalance + referrerBonus;
            
            // Update referrer's wallet balance
            await client.query(
              'UPDATE wallets SET "tikiBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
              [referrerNewBalance, user.referrerId]
            );
            
            // Create referral earning record
            const referralEarningResult = await client.query(`
              INSERT INTO referral_earnings (id, "referralId", "stakingId", amount, "createdAt")
              VALUES ($1, $2, $3, $4, NOW())
              RETURNING *
            `, [require('crypto').randomUUID(), referralRecord.id, id, referrerBonus]);
            
            referralEarning = referralEarningResult.rows[0];
            
            console.log('✅ Referral profit distributed:', {
              referrerId: user.referrerId,
              bonus: referrerBonus,
              newBalance: referrerNewBalance
            });

            // Send notification to referrer about the bonus
            try {
              await client.query(`
                INSERT INTO notifications (id, "userId", title, message, type, status, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
              `, [
                require('crypto').randomUUID(),
                user.referrerId,
                'Referral Bonus Earned!',
                `You earned ${referrerBonus.toFixed(2)} TIKI referral bonus from ${user.name}'s staking profit!`,
                'SUCCESS',
                'UNREAD'
              ]);
            } catch (notificationError) {
              console.error('❌ Error sending referral notification:', notificationError);
              // Don't fail the transaction for notification errors
            }
          }
        }
      }

      // Update staking record with profit and mark as claimed
      await client.query(`
        UPDATE staking 
        SET status = 'CLAIMED', claimed = true, profit = $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [profit, id]);

      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');

    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
        console.error('❌ Transaction rolled back due to error:', error);
      }
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }

    // Create transaction record
    await databaseHelpers.transaction.createTransaction({
      userId: session.id,
      type: 'BUY',
      amount: totalAmount,
      currency: 'TIKI',
      status: 'COMPLETED',
      gateway: 'Staking',
      description: `Auto-claimed staking rewards: ${staking.amountStaked} TIKI + ${rewardAmount} TIKI reward`
    });

    // Send notification
    await databaseHelpers.notification.createNotification({
      userId: session.id,
      title: 'Staking Rewards Claimed',
      message: `You have successfully claimed your staking rewards! Received ${totalAmount} TIKI (${staking.amountStaked} staked + ${rewardAmount} reward).`,
      type: 'STAKE'
    });

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Staking rewards claimed successfully',
      staker: {
        userId: session.id,
        stakedAmount: staking.amountStaked,
        rewardAmount: rewardAmount,
        profit: profit,
        totalAmount: totalAmount,
        newBalance: userWallet.tikiBalance + totalAmount
      },
      tokenSupply: {
        totalSupply: Number(updatedTokenSupply.totalSupply),
        userSupplyRemaining: Number(updatedTokenSupply.userSupplyRemaining),
        tokensDeducted: totalTokensNeeded
      },
      tokenValue: {
        baseValue: tokenValue.baseValue,
        currentValue: tokenValue.currentTokenValue,
        inflationFactor: tokenValue.inflationFactor,
        profitUSDValue: profit * tokenValue.currentTokenValue,
        totalUSDValue: totalAmount * tokenValue.currentTokenValue
      }
    };

    // Add referrer information if applicable
    if (referralEarning && referrerWallet) {
      responseData.referrer = {
        referrerId: user.referrerId,
        referralBonus: referralEarning.amount,
        newBalance: referrerNewBalance,
        referralEarningId: referralEarning.id,
        referralBonusUSDValue: referralEarning.amount * tokenValue.currentTokenValue
      };
      responseData.message += ' Referral bonus distributed to referrer.';
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error claiming staking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim staking rewards' },
      { status: 500 }
    );
  }
}






