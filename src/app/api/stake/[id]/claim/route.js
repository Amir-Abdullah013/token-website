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
    const totalRewardAmount = Number(
      staking.rewardAmount ?? (staking.amountStaked * staking.rewardPercent) / 100
    );
    const rewardAccrued = Number(staking.rewardAccrued || 0);
    const remainingReward = Math.max(0, totalRewardAmount - rewardAccrued);
    const updatedRewardAccrued = Math.max(totalRewardAmount, rewardAccrued + remainingReward);
    const principalAmount = Number(staking.amountStaked);
    const totalPayout = principalAmount + remainingReward;

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

    // Check if sufficient tokens are available in admin reserve for principal + any remaining rewards
    const totalReserveNeeded = totalPayout;
    const currentAdminReserve = Number(tokenSupply.adminReserve);
    if (currentAdminReserve < totalReserveNeeded) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient token supply for final staking payout',
          details: {
            required: totalReserveNeeded,
            available: currentAdminReserve,
            shortfall: totalReserveNeeded - currentAdminReserve,
            message: 'Admin reserve limit reached. Admin needs to add tokens to reserve.'
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

      await client.query(`
        UPDATE token_supply 
        SET "adminReserve" = "adminReserve" - $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [totalPayout, tokenSupply.id]);

      // Add principal (and any final reward) back to user's wallet
      const newVonBalance = userWallet.VonBalance + totalPayout;
      await client.query(
        'UPDATE wallets SET "VonBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
        [newVonBalance, session.id]
      );

      // Referral bonus already distributed on stake creation
      // No need to process it again here

      // Update staking record with profit and mark as claimed
      await client.query(`
        UPDATE staking 
        SET 
          status = 'CLAIMED', 
          claimed = true, 
          profit = $1, 
          "rewardAccrued" = GREATEST($1, "rewardAccrued"), 
          "daysRewarded" = GREATEST("daysRewarded", "durationDays"),
          "nextRewardDate" = NULL,
          "updatedAt" = NOW()
        WHERE id = $2
      `, [totalRewardAmount, id]);

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

    if (!updatedTokenSupply) {
      updatedTokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    }

    // Create transaction record
    await databaseHelpers.transaction.createTransaction({
      userId: session.id,
      type: 'UNSTAKE',
      amount: totalPayout,
      currency: 'Von',
      status: 'COMPLETED',
      gateway: 'Staking',
      description: `Staking principal released${remainingReward > 0 ? ` with ${remainingReward} Von final reward` : ''}`
    });

    // Send notification
    await databaseHelpers.notification.createNotification({
      userId: session.id,
      title: 'Staking Completed',
      message: `You have successfully claimed your ${principalAmount} Von principal${remainingReward > 0 ? ` along with a final ${remainingReward.toFixed(4)} Von reward` : ''}.`,
      type: 'STAKE'
    });

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Staking rewards claimed successfully',
      staker: {
        userId: session.id,
        stakedAmount: staking.amountStaked,
        rewardAmount: totalRewardAmount,
        rewardAccrued: updatedRewardAccrued,
        remainingReward,
        totalPayout,
        newBalance: userWallet.VonBalance + totalPayout
      },
      tokenSupply: {
        totalSupply: Number(updatedTokenSupply.totalSupply),
        adminReserve: Number(updatedTokenSupply.adminReserve),
        userSupplyRemaining: Number(updatedTokenSupply.userSupplyRemaining),
        tokensDeducted: totalPayout,
        deductedFrom: 'adminReserve'
      },
      tokenValue: {
        baseValue: tokenValue.baseValue,
        currentValue: tokenValue.currentTokenValue,
        inflationFactor: tokenValue.inflationFactor,
        profitUSDValue: totalRewardAmount * tokenValue.currentTokenValue,
        totalUSDValue: totalPayout * tokenValue.currentTokenValue
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






