import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * POST /api/ads/complete
 * Credits IMMEDIATE USABLE POINTS to user after successfully watching an ad.
 * Enforces 20-minute cooldown between ads.
 * Instead of inserting a new row per ad, we UPSERT a single row per user in ad_rewards.
 * No transaction row is created for ad rewards (keeps transactions table clean).
 */
export async function POST(request) {
  try {
    const { userId, timeSpent } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Require minimum 15 seconds viewing time
    const MIN_VIEW_TIME = 15; // seconds
    if (!timeSpent || timeSpent < MIN_VIEW_TIME) {
      return NextResponse.json({ 
        success: false, 
        error: `Please watch the ad for at least ${MIN_VIEW_TIME} seconds. You watched for ${Math.floor(timeSpent || 0)} seconds.` 
      }, { status: 400 });
    }

    const REWARD_AMOUNT = 10; // Points per ad (immediately usable)
    const COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

    // Check cooldown using single-row ad_rewards record (lastWatchedAt field)
    const lastAdResult = await databaseHelpers.pool.query(
      `SELECT "lastWatchedAt", "adsWatched", "totalPoints" FROM ad_rewards WHERE "userId" = $1`,
      [userId]
    );

    const now = new Date();

    if (lastAdResult.rows.length > 0) {
      const lastWatchedAt = lastAdResult.rows[0].lastWatchedAt;
      if (lastWatchedAt) {
        const lastTime = new Date(lastWatchedAt).getTime();
        const timeSinceLastAd = Date.now() - lastTime;
        if (timeSinceLastAd < COOLDOWN_MS) {
          const minutesLeft = Math.ceil((COOLDOWN_MS - timeSinceLastAd) / 60000);
          return NextResponse.json({ 
            success: false, 
            error: `Please wait ${minutesLeft} minutes before watching another ad.` 
          }, { status: 429 });
        }
      }
    }

    // Get user info to check for referrer
    const userResult = await databaseHelpers.pool.query(
      `SELECT "referrerId" FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const hasReferrer = !!user.referrerId;

    // Calculate reward distribution
    let userReward = REWARD_AMOUNT;
    let referrerReward = 0;

    if (hasReferrer) {
      userReward = REWARD_AMOUNT * 0.8;   // 80% to user
      referrerReward = REWARD_AMOUNT * 0.2; // 20% to referrer
    }

    const client = await databaseHelpers.pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Credit IMMEDIATE AD POINTS to user wallet
      await client.query(
        `UPDATE wallets 
         SET "adPoints" = COALESCE("adPoints", 0) + $1::DECIMAL(30,8), 
             "updatedAt" = $2
         WHERE "userId" = $3`,
        [userReward, now, userId]
      );

      // 2. Credit referrer if exists (also just wallet update, no transaction row)
      if (hasReferrer && referrerReward > 0) {
        await client.query(
          `UPDATE wallets 
           SET "adPoints" = COALESCE("adPoints", 0) + $1::DECIMAL(30,8), 
               "updatedAt" = $2
           WHERE "userId" = $3`,
          [referrerReward, now, user.referrerId]
        );

        // Update referrer's single ad_rewards row for their stats
        await client.query(
          `INSERT INTO ad_rewards (id, "userId", reward, "totalPoints", "referralPoints", "adsWatched", "lastWatchedAt", status, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, 0, 0, $2, 0, NULL, 'COMPLETED', $3, $3)
           ON CONFLICT ("userId") DO UPDATE SET
             "referralPoints" = COALESCE(ad_rewards."referralPoints", 0) + $2,
             "totalPoints" = COALESCE(ad_rewards."totalPoints", 0) + $2,
             "updatedAt" = $3`,
          [user.referrerId, referrerReward, now]
        );
      }

      // 3. UPSERT single ad_rewards row for this user (no new row per watch)
      const upsertResult = await client.query(
        `INSERT INTO ad_rewards (id, "userId", reward, "totalPoints", "referralPoints", "adsWatched", "lastWatchedAt", status, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $2, 0, 1, $3, 'COMPLETED', $3, $3)
         ON CONFLICT ("userId") DO UPDATE SET
           "totalPoints" = COALESCE(ad_rewards."totalPoints", 0) + $2,
           "adsWatched" = COALESCE(ad_rewards."adsWatched", 0) + 1,
           "lastWatchedAt" = $3,
           "updatedAt" = $3
         RETURNING "adsWatched", "lastWatchedAt"`,
        [userId, REWARD_AMOUNT, now]
      );

      await client.query('COMMIT');

      const adsWatched = parseInt(upsertResult.rows[0]?.adsWatched || 1);
      const nextAvailable = new Date(now.getTime() + COOLDOWN_MS);

      return NextResponse.json({
        success: true,
        message: hasReferrer 
          ? `Successfully earned ${userReward} points! Your referrer earned ${referrerReward} points.`
          : `Successfully earned ${userReward} points! Use them right away!`,
        reward: userReward,
        referrerReward: hasReferrer ? referrerReward : 0,
        adsWatchedToday: adsWatched,
        nextAdAvailable: nextAvailable.toISOString()
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error completing ad reward:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process ad reward' 
    }, { status: 500 });
  }
}
