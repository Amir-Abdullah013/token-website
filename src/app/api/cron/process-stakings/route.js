// OLD STAKING CRON - COMMENTED OUT
// New plan-based system is now in use
// Use /api/cron/unlock-plan-tokens for unlocking plan purchase tokens

import { NextResponse } from 'next/server';

export async function GET(request) {
  // Return message that old staking is deprecated
  return NextResponse.json({
    success: false,
    message: 'Old staking cron is deprecated. New plan-based system is in use.',
    note: 'Use /api/cron/unlock-plan-tokens for unlocking plan purchase tokens'
  }, { status: 410 }); // 410 Gone
}

/* COMMENTED OUT - OLD STAKING LOGIC
  try {
    // Verify cron authentication (Vercel Cron or CRON_SECRET)
    const authError = requireCronAuth(request);
    if (authError) {
      return authError;
    }

    console.log('🔄 Processing daily staking rewards...');

    const activeStakingsResult = await databaseHelpers.pool.query(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM staking s
      LEFT JOIN users u ON s."userId" = u.id
      WHERE s.status = 'ACTIVE'
      ORDER BY s."startDate" ASC
    `);

    const activeStakings = activeStakingsResult.rows;
    console.log(`📊 Found ${activeStakings.length} active stakings to evaluate`);

    if (activeStakings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active stakings found',
        processed: [],
        completed: [],
        skipped: [],
        errors: [],
        totalActive: 0,
        totalRewardsPaid: 0
      });
    }

    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    if (!tokenSupply) {
      throw new Error('Token supply not initialized');
    }

    let availableAdminReserve = Number(tokenSupply.adminReserve);
    let totalPrincipalReleased = 0;
    const processed = [];
    const completed = [];
    const skipped = [];
    const errors = [];
    let totalRewardsPaid = 0;
    const now = new Date();

    for (const staking of activeStakings) {
      try {
        const amountStaked = Number(staking.amountStaked);
        const rewardPercent = Number(staking.rewardPercent);
        // CRITICAL: Ensure durationDays is always an integer (database INT column)
        const durationDays = Math.floor(Math.abs(Number(staking.durationDays) || 0));
        const startDate = new Date(staking.startDate);
        const endDate = new Date(staking.endDate);
        // CRITICAL: Ensure daysRewarded is always an integer (database INT column)
        // Parse as integer explicitly to avoid decimal precision issues
        let previousDaysRewarded = parseInt(String(staking.daysRewarded || 0), 10);
        if (isNaN(previousDaysRewarded) || previousDaysRewarded < 0) {
          previousDaysRewarded = 0;
        }
        const previousAccrued = Number(staking.rewardAccrued || 0);

        // Validate integer fields
        if (durationDays <= 0 || !Number.isInteger(durationDays) || isNaN(durationDays)) {
          skipped.push({
            stakingId: staking.id,
            reason: 'Invalid duration (must be positive integer)',
          });
          continue;
        }
        
        // Final validation for previousDaysRewarded
        if (!Number.isInteger(previousDaysRewarded)) {
          console.warn(`⚠️ Invalid previousDaysRewarded for staking ${staking.id}: ${staking.daysRewarded}, defaulting to 0`);
          previousDaysRewarded = 0;
        }

        // Users get daily rewards for up to 365 days (full year)
        // But staking period determines when principal is released
        // Define maxRewardDays first to avoid scope issues
        const maxRewardDays = 365;
        
        // Calculate daily reward based on 365-day year (NEW LOGIC)
        // Annual reward = amountStaked * rewardPercent / 100
        // Daily reward = annual reward / 365
        const annualRewardAmount = (amountStaked * rewardPercent) / 100;
        const dailyReward = annualRewardAmount / 365;
        
        // Total reward for the staking period
        const totalRewardForPeriod = dailyReward * durationDays;

        // Calculate days since start (elapsed from startDate)
        // Ensure integer calculation to avoid decimal days
        const elapsedDays = Math.max(
          0,
          Math.floor((now.getTime() - startDate.getTime()) / DAY_IN_MS)
        );
        
        const cappedElapsedDays = Math.min(maxRewardDays, Math.floor(elapsedDays));
        // CRITICAL: Ensure pendingDays is always an integer
        // Use parseInt to force integer conversion and avoid any decimal precision issues
        let pendingDays = parseInt(String(Math.max(0, cappedElapsedDays - previousDaysRewarded)), 10) || 0;
        let rewardIncrement = pendingDays * dailyReward;
        
        // Check if staking period has ended (for principal release)
        const willCompleteAfterThisRun = now >= endDate;

        if (rewardIncrement <= EPSILON && !willCompleteAfterThisRun) {
          continue; // Nothing to pay today
        }

        if (rewardIncrement > 0 && rewardIncrement > availableAdminReserve + EPSILON) {
          skipped.push({
            stakingId: staking.id,
            reason: 'Insufficient admin reserve',
            required: rewardIncrement,
            available: availableAdminReserve
          });
          continue;
        }

        // CRITICAL: Ensure daysRewardedAfter is always an integer (database requires INT)
        // Calculate as integer explicitly - use parseInt to force integer conversion
        const daysRewardedAfterRaw = previousDaysRewarded + pendingDays;
        let daysRewardedAfter = parseInt(String(Math.min(maxRewardDays, daysRewardedAfterRaw)), 10);
        
        // Handle NaN or invalid values
        if (isNaN(daysRewardedAfter) || daysRewardedAfter < 0) {
          daysRewardedAfter = Math.min(maxRewardDays, Math.floor(daysRewardedAfterRaw));
          if (isNaN(daysRewardedAfter) || daysRewardedAfter < 0) {
            console.error(`❌ Invalid daysRewardedAfter calculation for staking ${staking.id}:`, {
              previousDaysRewarded,
              pendingDays,
              daysRewardedAfterRaw,
              daysRewardedAfter,
              stakingDaysRewarded: staking.daysRewarded,
              stakingDurationDays: staking.durationDays
            });
            throw new Error(`Invalid daysRewardedAfter calculation: ${daysRewardedAfter} (must be integer >= 0)`);
          }
        }
        
        // Final validation - must be a valid integer
        if (!Number.isInteger(daysRewardedAfter) || daysRewardedAfter < 0) {
          console.error(`❌ Final validation failed for daysRewardedAfter (staking ${staking.id}):`, {
            value: daysRewardedAfter,
            type: typeof daysRewardedAfter,
            isInteger: Number.isInteger(daysRewardedAfter),
            previousDaysRewarded,
            pendingDays
          });
          throw new Error(`Invalid daysRewardedAfter final value: ${daysRewardedAfter} (type: ${typeof daysRewardedAfter}, must be integer >= 0)`);
        }

        // Calculate total accrued reward (keep as Number for calculations)
        const newRewardAccrued = previousAccrued + rewardIncrement;

        // CRITICAL: Convert all Decimal/numeric values to strings for PostgreSQL DECIMAL columns
        // PostgreSQL DECIMAL columns work best with string representations to preserve precision
        // MUST be defined BEFORE the try block where they're used
        const totalRewardForPeriodStr = String(totalRewardForPeriod);
        const dailyRewardStr = String(dailyReward);
        const newRewardAccruedStr = String(newRewardAccrued);
        const rewardIncrementStr = String(rewardIncrement);
        const principalAmount = Number(staking.amountStaked);
        const principalAmountStr = String(principalAmount);

        let client;
        let principalReleased = false;
        try {
          client = await databaseHelpers.pool.connect();
          await client.query('BEGIN');

          // Pay daily rewards from admin reserve using atomic helper
          if (rewardIncrement > 0) {
            console.log('💰 Deducting reward from admin reserve:', {
              stakingId: staking.id,
              userId: staking.userId,
              rewardAmount: rewardIncrement
            });

            // Use atomic helper to update reserve AND log history in one operation
            const reserveResult = await databaseHelpers.adminReserveHistory.deductStakingReward({
              amount: rewardIncrement,
              userId: staking.userId,
              stakingId: staking.id,
              purpose: `Staking reward payout - ${pendingDays} day(s) of rewards (${daysRewardedAfter}/${durationDays} days total)`,
              adminId: 'SYSTEM',
              client: client // Use existing transaction
            });

            // Update availableAdminReserve for next iteration
            availableAdminReserve = Number(reserveResult.tokenSupply.adminReserve);

            // Add reward to user's wallet
            await client.query(
              `UPDATE wallets SET "VonBalance" = "VonBalance" + $1::DECIMAL(30,8), "updatedAt" = NOW() WHERE "userId" = $2`,
              [rewardIncrementStr, stakving.userId]
            );

            console.log('✅ Reward deducted from reserve and added to user wallet:', {
              reserveBefore: reserveResult.historyEntry.reserveBefore,
              reserveAfter: reserveResult.historyEntry.reserveAfter,
              historyId: reserveResult.historyEntry.id
            });
          }

          // Auto-release principal on end date by unlocking from stakingTokensAmount
          if (willCompleteAfterThisRun) {
            // Unlock staking tokens and add to VonBalance (NEW LOGIC)
            const unlockResult = await client.query(
              `
              UPDATE wallets 
              SET "stakingTokensAmount" = "stakingTokensAmount" - $1::DECIMAL(30,8),
                  "VonBalance" = "VonBalance" + $1::DECIMAL(30,8),
                  "updatedAt" = NOW()
              WHERE "userId" = $2 
                AND "stakingTokensAmount" >= $1::DECIMAL(30,8)
              RETURNING "stakingTokensAmount", "VonBalance"
            `,
              [principalAmountStr, staking.userId]
            );

            if (unlockResult.rowCount === 0) {
              throw new Error('Insufficient staking tokens to release principal');
            }

            principalReleased = true;
            console.log('✅ Principal released from stakingTokensAmount:', {
              userId: staking.userId,
              amount: principalAmount,
              remainingStakingTokens: unlockResult.rows[0].stakingTokensAmount
            });
          }

          // Calculate next reward date (only if not completed)
          const nextRewardDateValue = willCompleteAfterThisRun
            ? null
            : new Date(startDate.getTime() + (daysRewardedAfter + 1) * DAY_IN_MS);

          // CRITICAL: Ensure all integer values are properly formatted before SQL execution
          // Convert to integer using multiple methods for safety
          let daysRewardedInt;
          if (typeof daysRewardedAfter === 'number') {
            daysRewardedInt = Math.floor(Math.abs(daysRewardedAfter));
          } else {
            daysRewardedInt = parseInt(String(daysRewardedAfter).split('.')[0], 10); // Strip decimals if any
          }
          
          // Handle edge cases
          if (isNaN(daysRewardedInt) || !Number.isFinite(daysRewardedInt)) {
            daysRewardedInt = 0;
          }
          
          // Ensure it's within valid range
          daysRewardedInt = Math.max(0, Math.min(maxRewardDays, daysRewardedInt));
          
          // Final validation before database insert
          if (!Number.isInteger(daysRewardedInt) || daysRewardedInt < 0 || daysRewardedInt > maxRewardDays) {
            console.error(`❌ CRITICAL: Invalid daysRewardedInt before SQL insert:`, {
              stakingId: staking.id,
              daysRewardedAfter,
              daysRewardedAfterType: typeof daysRewardedAfter,
              daysRewardedInt,
              daysRewardedIntType: typeof daysRewardedInt,
              previousDaysRewarded,
              pendingDays,
              isInteger: Number.isInteger(daysRewardedInt)
            });
            throw new Error(`Invalid daysRewarded value for staking ${staking.id}: ${daysRewardedInt} (from ${daysRewardedAfter}). Must be integer between 0 and ${maxRewardDays}.`);
          }
          
          // Debug log for first few to verify values
          if (processed.length < 3) {
            console.log(`🔍 Debug: daysRewarded values for staking ${staking.id}:`, {
              previousDaysRewarded,
              pendingDays,
              daysRewardedAfter,
              daysRewardedInt,
              types: {
                after: typeof daysRewardedAfter,
                int: typeof daysRewardedInt
              }
            });
          }

          await client.query(
            `
            UPDATE staking 
            SET 
              "rewardAmount" = CASE WHEN "rewardAmount" = 0 THEN $1::DECIMAL(30,8) ELSE "rewardAmount" END,
              "dailyRewardAmount" = CASE WHEN "dailyRewardAmount" = 0 THEN $2::DECIMAL(30,8) ELSE "dailyRewardAmount" END,
              "rewardAccrued" = $3::DECIMAL(30,8),
              "daysRewarded" = CAST($4 AS INTEGER),
              "lastRewardDate" = CASE WHEN $5::DECIMAL(30,8) > 0 THEN NOW() ELSE "lastRewardDate" END,
              "nextRewardDate" = $6,
              status = CASE WHEN $7 THEN 'COMPLETED' ELSE status END,
              claimed = CASE WHEN $7 THEN false ELSE claimed END,
              profit = CASE WHEN $7 THEN $8::DECIMAL(30,8) ELSE profit END,
              "updatedAt" = NOW()
            WHERE id = $9
          `,
            [
              totalRewardForPeriodStr,    // DECIMAL(30,8)
              dailyRewardStr,              // DECIMAL(30,8)
              newRewardAccruedStr,         // DECIMAL(30,8)
              daysRewardedInt,             // INTEGER (already validated)
              rewardIncrementStr,          // DECIMAL(30,8) for comparison
              nextRewardDateValue,         // TIMESTAMP or NULL
              willCompleteAfterThisRun,    // BOOLEAN
              newRewardAccruedStr,         // DECIMAL(30,8) for profit
              staking.id                   // UUID/TEXT
            ]
          );

          await client.query('COMMIT');
          
          // Note: Reserve history is already logged by deductStakingReward() helper above
          // No need for separate history logging here
        } catch (transactionError) {
          if (client) {
            await client.query('ROLLBACK');
          }
          throw transactionError;
        } finally {
          if (client) {
            client.release();
          }
        }

        if (rewardIncrement > 0) {
          // Staking rewards have no fees, so netAmount = amount
          await databaseHelpers.transaction.createTransaction({
            userId: staking.userId,
            type: 'STAKE_REWARD',
            amount: rewardIncrement,
            currency: 'Von',
            status: 'COMPLETED',
            gateway: 'Staking',
            description: `Daily staking reward payout (${daysRewardedAfter}/${durationDays} days)`,
            feeAmount: 0, // No fees on staking rewards
            netAmount: rewardIncrement // Full amount (no fees deducted)
          });
          totalRewardsPaid += rewardIncrement;
          availableAdminReserve -= rewardIncrement;
        }

        if (principalReleased) {
          totalPrincipalReleased += principalAmount;
          // Note: Principal is now released from user's stakingTokensAmount, not admin reserve
        }

        processed.push({
          stakingId: staking.id,
          userId: staking.userId,
          rewardPaid: rewardIncrement,
          daysRewardedBefore: previousDaysRewarded,
          daysRewardedAfter,
          completed: willCompleteAfterThisRun,
          principalReleased
        });

        if (willCompleteAfterThisRun) {
          completed.push(staking.id);
          await databaseHelpers.notification.createNotification({
            userId: staking.userId,
            title: 'Staking Completed',
            message: `Your ${staking.amountStaked} Von principal has been returned automatically and all rewards have been paid.`,
            type: 'SUCCESS'
          });
        }
      } catch (error) {
        console.error(`❌ Error processing staking ${staking.id}:`, error);
        errors.push({
          stakingId: staking.id,
          userId: staking.userId,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed.length} stakings for daily rewards`,
      processed,
      completed,
      skipped,
      errors,
      totalActive: activeStakings.length,
      totalProcessed: processed.length,
      totalCompleted: completed.length,
      totalSkipped: skipped.length,
      totalErrors: errors.length,
      totalRewardsPaid,
      totalPrincipalReleased,
      remainingAdminReserve: availableAdminReserve
    });
  } catch (error) {
    console.error('❌ Error in daily staking processing:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process daily staking rewards',
        details: error.message
      },
      { status: 500 }
    );
  }
  */
