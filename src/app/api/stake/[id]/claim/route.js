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
    // Note: Principal is automatically released on end date, so we only handle remaining rewards
    const amountStaked = Number(staking.amountStaked);
    const rewardPercent = Number(staking.rewardPercent);
    const durationDays = Number(staking.durationDays);
    
    // Calculate total reward based on new 365-day system
    const annualRewardAmount = (amountStaked * rewardPercent) / 100;
    const dailyReward = annualRewardAmount / 365;
    const totalRewardForPeriod = dailyReward * durationDays;
    
    const rewardAccrued = Number(staking.rewardAccrued || 0);
    const remainingReward = Math.max(0, totalRewardForPeriod - rewardAccrued);
    
    // Principal should already be released automatically on end date
    // This endpoint only handles any remaining rewards
    const principalAmount = Number(staking.amountStaked);

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

    // Check if there are any remaining rewards to claim
    if (remainingReward <= 0.000001) {
      // No remaining rewards, just mark as claimed
      await databaseHelpers.staking.updateStakingStatus(staking.id, 'CLAIMED');
      try {
        await databaseHelpers.pool.query(
          'UPDATE staking SET claimed = true, "updatedAt" = NOW() WHERE id = $1',
          [id]
        );
      } catch (err) {
        console.error('Error marking staking as claimed:', err);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Staking already fully processed - marked as claimed',
        remainingReward: 0
      });
    }

    // Check if sufficient tokens are available in admin reserve for remaining rewards
    const currentAdminReserve = Number(tokenSupply.adminReserve);
    if (currentAdminReserve < remainingReward) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient admin reserve for remaining rewards',
          details: {
            required: remainingReward,
            available: currentAdminReserve,
            shortfall: remainingReward - currentAdminReserve,
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

      // Pay remaining rewards from admin reserve
      const reserveBefore = Number(tokenSupply.adminReserve);
      await client.query(`
        UPDATE token_supply 
        SET "adminReserve" = "adminReserve" - $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [remainingReward, tokenSupply.id]);

      // Add remaining reward to user's wallet
      // Note: Principal should already be released automatically on end date
      const newVonBalance = userWallet.VonBalance + remainingReward;
      await client.query(
        'UPDATE wallets SET "VonBalance" = $1, "updatedAt" = NOW() WHERE "userId" = $2',
        [newVonBalance, session.id]
      );

      // Update staking record with final reward accrued and mark as claimed
      const finalRewardAccrued = rewardAccrued + remainingReward;
      await client.query(`
        UPDATE staking 
        SET 
          status = 'CLAIMED', 
          claimed = true, 
          profit = $1, 
          "rewardAccrued" = $2,
          "nextRewardDate" = NULL,
          "updatedAt" = NOW()
        WHERE id = $3
      `, [finalRewardAccrued, finalRewardAccrued, id]);

      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');

      // Log admin reserve history after successful commit - with retry logic
      if (remainingReward > 0) {
        const reserveAfter = reserveBefore - remainingReward;
        
        // Retry logging up to 3 times if it fails
        let logged = false;
        let retries = 0;
        const maxRetries = 3;
        
        while (!logged && retries < maxRetries) {
          try {
            const logResult = await databaseHelpers.adminReserveHistory.logReserveTransaction({
              transactionType: 'STAKING_REWARD',
              amount: -remainingReward, // Negative for removal
              purpose: `Final staking reward claim for completed staking`,
              userId: session.id,
              adminId: 'SYSTEM', // User-initiated but system processed
              reserveBefore: reserveBefore,
              reserveAfter: reserveAfter,
              referenceId: id,
              referenceType: 'STAKING_REWARD'
            });
            
            if (logResult) {
              logged = true;
              console.log('✅ Staking claim reward logged to reserve history:', {
                stakingId: id,
                userId: session.id,
                amount: remainingReward
              });
            } else {
              retries++;
              if (retries < maxRetries) {
                console.warn(`⚠️ Reserve history logging failed, retrying (${retries}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
              }
            }
          } catch (logError) {
            retries++;
            console.error(`❌ Error logging reserve history (attempt ${retries}/${maxRetries}):`, logError);
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            } else {
              console.error('❌ CRITICAL: Failed to log staking claim reward to reserve history after all retries:', {
                stakingId: id,
                userId: session.id,
                amount: remainingReward,
                error: logError.message
              });
            }
          }
        }
      }

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

    // Create transaction record for remaining rewards (principal already released automatically)
    await databaseHelpers.transaction.createTransaction({
      userId: session.id,
      type: 'STAKE_REWARD',
      amount: remainingReward,
      currency: 'Von',
      status: 'COMPLETED',
      gateway: 'Staking',
      description: `Final staking reward claim (${remainingReward.toFixed(4)} Von)`,
      feeAmount: 0, // No fees on staking rewards
      netAmount: remainingReward // Full amount (no fees deducted)
    });

    // Send notification
    await databaseHelpers.notification.createNotification({
      userId: session.id,
      title: 'Staking Claimed',
      message: `You have successfully claimed your remaining ${remainingReward.toFixed(4)} Von reward. Your ${principalAmount} Von principal was already released automatically on the staking end date.`,
      type: 'SUCCESS'
    });

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Staking rewards claimed successfully',
      staker: {
        userId: session.id,
        stakedAmount: amountStaked,
        totalRewardForPeriod: totalRewardForPeriod,
        rewardAccrued: finalRewardAccrued,
        remainingReward,
        newBalance: userWallet.VonBalance + remainingReward,
        note: 'Principal was automatically released on staking end date'
      },
      tokenSupply: {
        totalSupply: Number(updatedTokenSupply.totalSupply),
        adminReserve: Number(updatedTokenSupply.adminReserve),
        userSupplyRemaining: Number(updatedTokenSupply.userSupplyRemaining),
        tokensDeducted: remainingReward,
        deductedFrom: 'adminReserve (rewards only, principal already released)'
      },
      tokenValue: {
        baseValue: tokenValue.baseValue,
        currentValue: tokenValue.currentTokenValue,
        inflationFactor: tokenValue.inflationFactor,
        profitUSDValue: totalRewardForPeriod * tokenValue.currentTokenValue,
        remainingRewardUSDValue: remainingReward * tokenValue.currentTokenValue
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






