import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

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

    // Calculate total tokens needed (referral bonus already distributed on stake creation)
    let totalTokensNeeded = profit;
    // NOTE: Referral bonus is now distributed immediately when stake is created,
    // not when staking is claimed, so we don't add it here anymore

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

    // Start transaction for claim processing
    let client;
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

      // Referral bonus already distributed on stake creation
      // No need to process it again here

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

    // Referral bonus was already distributed on stake creation
    // No additional referrer information to include

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error claiming staking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim staking rewards' },
      { status: 500 }
    );
  }
}






