import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * POST /api/ads/complete
 * Credits LOCKED POINTS to user after successfully watching an ad
 * Enforces 5-minute cooldown between ads
 * If user has referrer: 80% to user, 20% to referrer
 * If no referrer: 100% to user
 */
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const REWARD_AMOUNT = 10; // Locked points per ad
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Check cooldown - get last ad timestamp
    const lastAdResult = await databaseHelpers.pool.query(
      `SELECT "createdAt" FROM ad_rewards 
       WHERE "userId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT 1`,
      [userId]
    );

    if (lastAdResult.rows.length > 0) {
      const lastAdTime = new Date(lastAdResult.rows[0].createdAt).getTime();
      const now = Date.now();
      const timeSinceLastAd = now - lastAdTime;
      
      if (timeSinceLastAd < COOLDOWN_MS) {
        const minutesLeft = Math.ceil((COOLDOWN_MS - timeSinceLastAd) / 60000);
        console.log('❌ Cooldown active:', minutesLeft, 'minutes remaining');
        return NextResponse.json({ 
          success: false, 
          error: `Please wait ${minutesLeft} minutes before watching another ad.` 
        }, { status: 429 });
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
      userReward = REWARD_AMOUNT * 0.8; // 80% to user
      referrerReward = REWARD_AMOUNT * 0.2; // 20% to referrer
    }

    // Start transaction
    const client = await databaseHelpers.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current timestamp
      const now = new Date();

      // Credit LOCKED POINTS to user
      await client.query(
        `UPDATE wallets 
         SET "lockedAdPoints" = "lockedAdPoints" + $1::DECIMAL(30,8), 
             "updatedAt" = $2
         WHERE "userId" = $3`,
        [userReward, now, userId]
      );

      // Credit referrer if exists
      if (hasReferrer && referrerReward > 0) {
        await client.query(
          `UPDATE wallets 
           SET "lockedAdPoints" = "lockedAdPoints" + $1::DECIMAL(30,8), 
               "updatedAt" = $2
           WHERE "userId" = $3`,
          [referrerReward, now, user.referrerId]
        );

        // Create transaction record for referrer
        await databaseHelpers.transaction.createTransaction({
          userId: user.referrerId,
          type: 'AD_REWARD',
          amount: referrerReward,
          currency: 'Points',
          status: 'COMPLETED',
          gateway: 'Adsterra',
          description: `Referral ad bonus: Earned ${referrerReward} locked points from referral's ad view`,
          feeAmount: 0,
          netAmount: referrerReward
        });
      }

      // Record ad reward
      const adRewardResult = await client.query(
        `INSERT INTO ad_rewards (id, "userId", reward, status, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'COMPLETED', $3, $3)
         RETURNING "createdAt"`,
        [userId, REWARD_AMOUNT, now]
      );

      // Create transaction record for user
      await databaseHelpers.transaction.createTransaction({
        userId,
        type: 'AD_REWARD',
        amount: userReward,
        currency: 'Points',
        status: 'COMPLETED',
        gateway: 'Adsterra',
        description: hasReferrer 
          ? `Ad reward: Visited Adsterra ad and earned ${userReward} locked points (80% share)`
          : `Ad reward: Visited Adsterra ad and earned ${userReward} locked points`,
        feeAmount: 0,
        netAmount: userReward
      });

      await client.query('COMMIT');

      // Get today's count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM ad_rewards 
         WHERE "userId" = $1 AND "createdAt" >= $2`,
        [userId, today]
      );

      const adsWatchedToday = parseInt(countResult.rows[0]?.count || 0);

      // Calculate next available time (current time + 5 minutes)
      const createdAt = new Date(adRewardResult.rows[0].createdAt);
      const nextAvailable = new Date(createdAt.getTime() + COOLDOWN_MS);

      console.log('✅ Ad completed successfully');
      console.log('User:', userId);
      console.log('User reward:', userReward);
      if (hasReferrer) {
        console.log('Referrer reward:', referrerReward);
      }
      console.log('Watched at:', createdAt.toISOString());
      console.log('Next available:', nextAvailable.toISOString());
      console.log('Ads today:', adsWatchedToday);

      return NextResponse.json({
        success: true,
        message: hasReferrer 
          ? `Successfully earned ${userReward} locked points! Your referrer earned ${referrerReward} points.`
          : `Successfully earned ${userReward} locked points!`,
        reward: userReward,
        referrerReward: hasReferrer ? referrerReward : 0,
        adsWatchedToday,
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
