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

    // Start transaction for referral profit distribution
    let client;
    let referralEarning = null;
    let referrerWallet = null;
    let referrerNewBalance = null;

    try {
      client = await databaseHelpers.pool.connect();
      await client.query('BEGIN');

      // Add staked amount + reward back to user's wallet
      const newTikiBalance = userWallet.tikiBalance + totalAmount;
      await client.query(
        'UPDATE wallets SET "tikiBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
        [newTikiBalance, session.id]
      );

      // Check if user has a referrer and distribute referral profit
      if (user.referrerId) {
        console.log('🔗 User has referrer, calculating referral profit...');
        
        // Get the referral record
        const referral = await client.query(
          'SELECT * FROM referrals WHERE "referrerId" = $1 AND "referredId" = $2',
          [user.referrerId, session.id]
        );

        if (referral.rows.length > 0) {
          const referralRecord = referral.rows[0];
          
          // Calculate referrer's bonus (10% of staking profit)
          const referrerBonus = (profit * 10) / 100;
          
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
      type: 'UNSTAKE',
      amount: totalAmount,
      currency: 'TIKI',
      status: 'COMPLETED',
      gateway: 'Staking',
      description: `Claimed staking rewards: ${staking.amountStaked} TIKI + ${rewardAmount} TIKI reward`
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
      }
    };

    // Add referrer information if applicable
    if (referralEarning && referrerWallet) {
      responseData.referrer = {
        referrerId: user.referrerId,
        referralBonus: referralEarning.amount,
        newBalance: referrerNewBalance,
        referralEarningId: referralEarning.id
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






