import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';
import { requireCronAuth } from '@/lib/cron-auth.js';

/**
 * Cron job to unlock plan purchase tokens after 6 months
 * Should run daily to check for tokens that need to be unlocked
 */
export async function GET(request) {
  try {
    // Verify cron authentication
    const authError = requireCronAuth(request);
    if (authError) {
      return authError;
    }

    console.log('🔄 Processing plan token unlocks...');

    const now = new Date();
    
    // Find all active plan purchases where unlock date has passed
    const result = await databaseHelpers.pool.query(`
      SELECT pp.*, u.name as user_name, u.email as user_email
      FROM plan_purchases pp
      LEFT JOIN users u ON pp."userId" = u.id
      WHERE pp.status = 'ACTIVE'
        AND pp."unlockDate" <= $1
      ORDER BY pp."unlockDate" ASC
    `, [now]);

    const purchasesToUnlock = result.rows;
    console.log(`📊 Found ${purchasesToUnlock.length} plan purchases ready to unlock`);

    if (purchasesToUnlock.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No plan purchases ready to unlock',
        unlocked: [],
        errors: []
      });
    }

    const unlocked = [];
    const errors = [];

    for (const purchase of purchasesToUnlock) {
      let client;
      try {
        client = await databaseHelpers.pool.connect();
        await client.query('BEGIN');

        const tokensToUnlock = Number(purchase.tokensPurchased);
        const userId = purchase.userId;

        // 1. Remove tokens from lockedPlanTokensAmount
        // 2. Add tokens to VonBalance (unlock them)
        await client.query(`
          UPDATE wallets 
          SET "lockedPlanTokensAmount" = "lockedPlanTokensAmount" - $1::DECIMAL(30,8),
              "VonBalance" = "VonBalance" + $1::DECIMAL(30,8),
              "updatedAt" = NOW()
          WHERE "userId" = $2
            AND "lockedPlanTokensAmount" >= $1::DECIMAL(30,8)
        `, [tokensToUnlock.toString(), userId]);

        // Check if update was successful
        const walletCheck = await client.query(
          'SELECT "lockedPlanTokensAmount", "VonBalance" FROM wallets WHERE "userId" = $1',
          [userId]
        );

        if (walletCheck.rows.length === 0) {
          throw new Error('Wallet not found');
        }

        // 3. Update plan purchase status to UNLOCKED
        await client.query(
          `UPDATE plan_purchases 
           SET status = 'UNLOCKED', "updatedAt" = NOW()
           WHERE id = $1`,
          [purchase.id]
        );

        // 4. Create transaction record
        await databaseHelpers.transaction.createTransaction({
          userId: userId,
          type: 'BUY', // Using BUY type since tokens are being added to balance
          amount: tokensToUnlock,
          currency: 'Von',
          status: 'COMPLETED',
          gateway: 'Plan Unlock',
          description: `Plan purchase tokens unlocked: ${tokensToUnlock.toFixed(2)} tokens from ${purchase.planAmount} plan`,
          feeAmount: 0,
          netAmount: tokensToUnlock
        });

        await client.query('COMMIT');

        // 5. Create notification for user
        await databaseHelpers.notification.createNotification({
          userId: userId,
          title: 'Tokens Unlocked! 🎉',
          message: `Your ${tokensToUnlock.toFixed(2)} tokens from your $${purchase.planAmount} plan purchase have been unlocked and are now available in your wallet!`,
          type: 'SUCCESS'
        });

        unlocked.push({
          purchaseId: purchase.id,
          userId: userId,
          tokensUnlocked: tokensToUnlock,
          planAmount: purchase.planAmount
        });

        console.log(`✅ Unlocked ${tokensToUnlock} tokens for user ${userId} (plan purchase ${purchase.id})`);

      } catch (error) {
        if (client) {
          await client.query('ROLLBACK');
        }
        console.error(`❌ Error unlocking tokens for purchase ${purchase.id}:`, error);
        errors.push({
          purchaseId: purchase.id,
          userId: purchase.userId,
          error: error.message
        });
      } finally {
        if (client) {
          client.release();
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${purchasesToUnlock.length} plan purchases`,
      unlocked: unlocked,
      errors: errors,
      totalUnlocked: unlocked.length,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('❌ Error in plan token unlock cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process plan token unlocks',
        details: error.message
      },
      { status: 500 }
    );
  }
}

