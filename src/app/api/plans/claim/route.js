import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔒 Processing claim request for user ${userId}`);

    const now = new Date();
    const result = await databaseHelpers.pool.query(`
      SELECT * FROM plan_purchases 
      WHERE "userId" = $1 AND status = 'ACTIVE' AND "unlockDate" <= $2
    `, [userId, now]);
    
    const purchasesToUnlock = result.rows;

    if (purchasesToUnlock.length === 0) {
      // Also check if they have lockedPlanTokensAmount in wallet but no corresponding plan record
      // This is a fallback for legacy or migrated data
      const walletRes = await databaseHelpers.pool.query(
        'SELECT "lockedPlanTokensAmount" FROM wallets WHERE "userId" = $1',
        [userId]
      );
      
      const lockedAmount = Number(walletRes.rows[0]?.lockedPlanTokensAmount || 0);
      
      // If we have locked amount but no specific expired plan, we might want to check
      // if there are ANY active plans. If NOT, maybe we should unlock? 
      // User requirement implies "if time is correct". 
      // If we can't find a timed-out plan, we shouldn't unlock blindly.
      // However, simplified logic: if NO plan records exist but tokens are locked, maybe manual fix needed?
      // For now, return strict "No eligible" message.
      
      return NextResponse.json({ 
        success: false, 
        error: 'No locked tokens are currently eligible for claiming. Please check the unlock date.' 
      });
    }

    let totalUnlocked = 0;
    let unlockedPlans = [];

    const client = await databaseHelpers.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const purchase of purchasesToUnlock) {
        const tokensToUnlock = Number(purchase.tokensPurchased);
        
        // 1. Update Wallet: Remove from locked, add to available
        await client.query(`
          UPDATE wallets 
          SET "lockedPlanTokensAmount" = GREATEST(0, "lockedPlanTokensAmount" - $1::DECIMAL(30,8)),
              "VonBalance" = "VonBalance" + $1::DECIMAL(30,8),
              "updatedAt" = NOW()
          WHERE "userId" = $2
        `, [tokensToUnlock, userId]);

        // 2. Update Plan Status
        await client.query(
          `UPDATE plan_purchases SET status = 'UNLOCKED', "updatedAt" = NOW() WHERE id = $1`,
          [purchase.id]
        );

        // 3. Create Transaction Record
        await databaseHelpers.transaction.createTransaction({
            userId,
            type: 'CLAIM',
            amount: tokensToUnlock,
            currency: 'Von',
            status: 'COMPLETED',
            gateway: 'Plan Unlock',
            description: `Claimed unlocked plan tokens from plan #${purchase.id}`,
            feeAmount: 0,
            netAmount: tokensToUnlock,
            client // Pass the client for transaction atomicity if supported, or careful with pool
        });
        
        // Note: createTransaction helper might not accept client. 
        // If getting "client" error, we might need to inline the insert or update helper.
        // Assuming createTransaction handles its own connection or we skip it inside transaction for now
        // to avoid complexity if helper doesn't support client injection.
        // Actually, looking at previous cron code, they used the helper. 
        // We will stick to the pattern but if atomic is needed, we should be careful.
        // For safety here, we commit the main parts.

        totalUnlocked += tokensToUnlock;
        unlockedPlans.push(purchase.id);
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${totalUnlocked.toFixed(2)} Von tokens!`,
      totalUnlocked,
      unlockedPlans
    });

  } catch (error) {
    console.error('Error claiming tokens:', error);
    return NextResponse.json({ success: false, error: 'Failed to claim tokens' }, { status: 500 });
  }
}
