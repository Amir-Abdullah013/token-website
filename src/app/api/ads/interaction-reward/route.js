import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * POST /api/ads/interaction-reward
 * Rewards users for page visits and ad impressions.
 * Does NOT insert transaction rows (keeps transactions table clean).
 * Only updates wallet adPoints and uses ad_rewards row for cooldown tracking.
 */
export async function POST(request) {
  try {
    const { userId, interactionType, durationSeconds } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Define reward amounts based on interaction type
    const REWARDS = {
      'page_visit': 20,        // 20 points for visiting (30 min cooldown)
      'ad_click': 10,          // 10 points for clicking ads
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

    // Cooldown durations
    const COOLDOWNS = {
      'page_visit': 30 * 60 * 1000,   // 30 minutes
      'default': 10 * 1000             // 10 seconds for other types
    };
    const cooldownDuration = COOLDOWNS[interactionType] || COOLDOWNS['default'];

    const client = await databaseHelpers.pool.connect();

    try {
      // Check cooldown from ad_rewards row (lastWatchedAt for page_visit; or just use a short ad_rewards check)
      // For page_visit cooldown, check the ad_rewards row's updatedAt is older than cooldown
      // For simplicity, we check via a separate ad_interaction_cooldowns pattern using ad_rewards referralPoints timestamp trick.
      // Actually: for page_visit, use the existing ad_rewards "updatedAt" field as the interaction timestamp check.
      // For other short interactions, skip cooldown tracking in DB (10s is handled client-side).
      if (interactionType === 'page_visit') {
        const lastVisit = await client.query(
          `SELECT "updatedAt" FROM ad_rewards WHERE "userId" = $1`,
          [userId]
        );
        if (lastVisit.rows.length > 0 && lastVisit.rows[0].updatedAt) {
          const lastTime = new Date(lastVisit.rows[0].updatedAt).getTime();
          const diff = Date.now() - lastTime;
          if (diff < cooldownDuration) {
            client.release();
            const remainingMinutes = Math.ceil((cooldownDuration - diff) / 60000);
            return NextResponse.json({
              success: false,
              error: `Please wait ${remainingMinutes} minutes before next reward`
            }, { status: 429 });
          }
        }
      }

      await client.query('BEGIN');

      const now = new Date();

      // Credit ad points to user wallet
      await client.query(
        `UPDATE wallets 
         SET "adPoints" = COALESCE("adPoints", 0) + $1::DECIMAL(30,8), 
             "updatedAt" = $2
         WHERE "userId" = $3`,
        [rewardAmount, now, userId]
      );

      // For page_visit: update the ad_rewards row (upsert) to track cooldown via updatedAt
      if (interactionType === 'page_visit') {
        await client.query(
          `INSERT INTO ad_rewards (id, "userId", reward, "totalPoints", "referralPoints", "adsWatched", "lastWatchedAt", status, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, 0, $2, 0, 0, NULL, 'COMPLETED', $3, $3)
           ON CONFLICT ("userId") DO UPDATE SET
             "totalPoints" = COALESCE(ad_rewards."totalPoints", 0) + $2,
             "updatedAt" = $3`,
          [userId, rewardAmount, now]
        );
      }

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
