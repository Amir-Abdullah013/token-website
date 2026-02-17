import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';
import crypto from 'crypto';

/**
 * POST /api/ads/interaction-reward
 * Rewards users for page interactions and ad viewing time
 * This helps reward engagement with embedded Adsterra ads
 */
export async function POST(request) {
  try {
    const { userId, interactionType, durationSeconds } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Define reward amounts based on interaction type
    // Define reward amounts based on interaction type
    const REWARDS = {
      'page_visit': 20,        // 20 points for visiting (25 min cooldown)
      'ad_click': 10,          // 10 points for clicking ads (as requested)
      'time_spent_30s': 0,     // Disabled
      'time_spent_60s': 0,     // Disabled
      'time_spent_120s': 0,    // Disabled
      'ad_impression': 0.5,    // Reward for ad impression
    };

    const rewardAmount = REWARDS[interactionType] || 0;

    if (rewardAmount === 0 && interactionType !== 'ad_impression') {
      return NextResponse.json({
        success: false,
        error: 'Invalid interaction type or reward disabled'
      }, { status: 400 });
    }

    // Check last interaction reward time to prevent spam
    // 30 minutes for page visit, 10 seconds for others
    const COOLDOWNS = {
      'page_visit': 30 * 60 * 1000, 
      'default': 10 * 1000
    };
    
    const cooldownDuration = COOLDOWNS[interactionType] || COOLDOWNS['default'];

    const client = await databaseHelpers.pool.connect();
    
    try {
      // Check last interaction
      const lastInteraction = await client.query(
        `SELECT "createdAt" FROM transactions
         WHERE "userId" = $1
         AND description LIKE $2
         ORDER BY "createdAt" DESC
         LIMIT 1`,
        [userId, `%${interactionType}%`]
      );

      if (lastInteraction.rows.length > 0) {
        const lastTime = new Date(lastInteraction.rows[0].createdAt).getTime();
        const now = Date.now();
        const diff = now - lastTime;
        
        if (diff < cooldownDuration) {
          client.release(); // Important: Release before returning early
          const remainingMinutes = Math.ceil((cooldownDuration - diff) / 60000);
          return NextResponse.json({
            success: false,
            error: `Please wait ${remainingMinutes} minutes before next reward`
          }, { status: 429 });
        }
      }

      await client.query('BEGIN');

      const now = new Date();
      const transactionId = crypto.randomUUID();

      // Credit ad points - try adPoints first, fallback to lockedAdPoints
      try {
        // Create a savepoint so we can rollback just this update if it fails (e.g. column missing)
        await client.query('SAVEPOINT try_ad_points');
        
        await client.query(
          `UPDATE wallets 
           SET "adPoints" = COALESCE("adPoints", 0) + $1::DECIMAL(30,8), 
               "updatedAt" = $2
           WHERE "userId" = $3`,
          [rewardAmount, now, userId]
        );
        
        await client.query('RELEASE SAVEPOINT try_ad_points');
      } catch (updateErr) {
        // Rollback to savepoint to recover the transaction
        await client.query('ROLLBACK TO SAVEPOINT try_ad_points');
        
        console.log('adPoints update failed (likely column missing), falling back to lockedAdPoints');
        // Fallback to lockedAdPoints
        await client.query(
          `UPDATE wallets 
           SET "lockedAdPoints" = COALESCE("lockedAdPoints", 0) + $1::DECIMAL(30,8), 
               "updatedAt" = $2
           WHERE "userId" = $3`,
          [rewardAmount, now, userId]
        );
      }

      // Create transaction record
      await client.query(
        `INSERT INTO transactions (
          id, "userId", type, amount, currency, status, gateway, description, 
          "feeAmount", "netAmount", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          transactionId,
          userId,
          'AD_INTERACTION',
          rewardAmount,
          'Points',
          'COMPLETED',
          'Adsterra',
          `Interaction reward: ${interactionType} (${durationSeconds || 0}s) - earned ${rewardAmount} points`,
          0,
          rewardAmount,
          now,
          now
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        reward: rewardAmount,
        interactionType,
        message: `Earned ${rewardAmount} points for ${interactionType}`
      });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Database error in interaction reward:', err);
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error processing interaction reward:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process reward' 
    }, { status: 500 });
  }
}
