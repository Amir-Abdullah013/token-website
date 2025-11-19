import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const EPSILON = 0.000001;

export async function GET() {
  try {
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
        const totalReward = Number(
          staking.rewardAmount ?? (staking.amountStaked * staking.rewardPercent) / 100
        );
        const dailyReward = Number(
          staking.dailyRewardAmount ?? (staking.durationDays > 0 ? totalReward / staking.durationDays : 0)
        );
        const durationDays = Number(staking.durationDays);
        const startDate = new Date(staking.startDate);
        const endDate = new Date(staking.endDate);
        const previousDaysRewarded = Number(staking.daysRewarded || 0);
        const previousAccrued = Number(staking.rewardAccrued || 0);

        if (durationDays <= 0) {
          skipped.push({
            stakingId: staking.id,
            reason: 'Invalid duration',
          });
          continue;
        }

        const elapsedDays = Math.max(
          0,
          Math.floor((now.getTime() - startDate.getTime()) / DAY_IN_MS)
        );
        const cappedElapsedDays = Math.min(durationDays, elapsedDays);
        let pendingDays = Math.max(0, cappedElapsedDays - previousDaysRewarded);
        let rewardIncrement = pendingDays * dailyReward;
        const willCompleteAfterThisRun =
          previousDaysRewarded + pendingDays >= durationDays && now >= endDate;

        if (willCompleteAfterThisRun) {
          // Make sure any floating-point remainder is paid on the final run
          const totalRewardRemaining = totalReward - (previousAccrued + rewardIncrement);
          if (totalRewardRemaining > EPSILON) {
            rewardIncrement += totalRewardRemaining;
          }
        }

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

        const daysRewardedAfter = willCompleteAfterThisRun
          ? durationDays
          : previousDaysRewarded + pendingDays;

        let client;
        const principalAmount = Number(staking.amountStaked);
        let principalReleased = false;
        try {
          client = await databaseHelpers.pool.connect();
          await client.query('BEGIN');

          if (rewardIncrement > 0) {
            await client.query(
              `
              UPDATE token_supply 
              SET "adminReserve" = "adminReserve" - $1, "updatedAt" = NOW()
              WHERE id = $2
            `,
              [rewardIncrement, tokenSupply.id]
            );

            await client.query(
              'UPDATE wallets SET "VonBalance" = "VonBalance" + $1, "updatedAt" = NOW() WHERE "userId" = $2',
              [rewardIncrement, staking.userId]
            );
          }

          if (willCompleteAfterThisRun) {
            const reserveResult = await client.query(
              `
              UPDATE token_supply 
              SET "adminReserve" = "adminReserve" - $1, "updatedAt" = NOW()
              WHERE id = $2 AND "adminReserve" >= $1
              RETURNING "adminReserve"
            `,
              [principalAmount, tokenSupply.id]
            );

            if (reserveResult.rowCount === 0) {
              throw new Error('Insufficient admin reserve to release staking principal');
            }

            await client.query(
              'UPDATE wallets SET "VonBalance" = "VonBalance" + $1, "updatedAt" = NOW() WHERE "userId" = $2',
              [principalAmount, staking.userId]
            );

            principalReleased = true;
          }

          const nextRewardDateValue = willCompleteAfterThisRun
            ? null
            : new Date(startDate.getTime() + (daysRewardedAfter + 1) * DAY_IN_MS);

          await client.query(
            `
            UPDATE staking 
            SET 
              "rewardAmount" = CASE WHEN "rewardAmount" = 0 THEN $1 ELSE "rewardAmount" END,
              "dailyRewardAmount" = CASE WHEN "dailyRewardAmount" = 0 THEN $2 ELSE "dailyRewardAmount" END,
              "rewardAccrued" = COALESCE("rewardAccrued", 0) + $3,
              "daysRewarded" = $4,
              "lastRewardDate" = CASE WHEN $3 > 0 THEN NOW() ELSE "lastRewardDate" END,
              "nextRewardDate" = $5,
              status = CASE WHEN $6 THEN 'CLAIMED' ELSE status END,
              claimed = CASE WHEN $6 THEN true ELSE claimed END,
              profit = CASE WHEN $6 THEN $8 ELSE profit END,
              "updatedAt" = NOW()
            WHERE id = $7
          `,
            [
              totalReward,
              dailyReward,
              rewardIncrement,
              daysRewardedAfter,
              nextRewardDateValue,
              willCompleteAfterThisRun,
              staking.id,
              totalReward
            ]
          );

          await client.query('COMMIT');
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
          await databaseHelpers.transaction.createTransaction({
            userId: staking.userId,
            type: 'STAKE_REWARD',
            amount: rewardIncrement,
            currency: 'Von',
            status: 'COMPLETED',
            gateway: 'Staking',
            description: `Daily staking reward payout (${daysRewardedAfter}/${durationDays} days)`
          });
          totalRewardsPaid += rewardIncrement;
          availableAdminReserve -= rewardIncrement;
        }

        if (principalReleased) {
          totalPrincipalReleased += principalAmount;
          availableAdminReserve -= principalAmount;
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
}
