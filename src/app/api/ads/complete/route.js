import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * POST /api/ads/complete
 * Credits LOCKED POINTS to user after successfully watching an ad
 * Enforces 30-minute cooldown between ads
 */
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const REWARD_AMOUNT = 10; // Locked points per ad
    const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

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

    // Start transaction
    const client = await databaseHelpers.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current timestamp
      const now = new Date();

      // Credit LOCKED POINTS
      await client.query(
        `UPDATE wallets 
         SET "lockedAdPoints" = "lockedAdPoints" + $1::DECIMAL(30,8), 
             "updatedAt" = $2
         WHERE "userId" = $3`,
        [REWARD_AMOUNT, now, userId]
      );

      // Record ad reward
      const adRewardResult = await client.query(
        `INSERT INTO ad_rewards (id, "userId", reward, status, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'COMPLETED', $3, $3)
         RETURNING "createdAt"`,
        [userId, REWARD_AMOUNT, now]
      );

      // Create transaction record
      await databaseHelpers.transaction.createTransaction({
        userId,
        type: 'AD_REWARD',
        amount: REWARD_AMOUNT,
        currency: 'Points',
        status: 'COMPLETED',
        gateway: 'Adsterra',
        description: `Ad reward: Visited Adsterra ad and earned ${REWARD_AMOUNT} locked points`,
        feeAmount: 0,
        netAmount: REWARD_AMOUNT
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

      // Calculate next available time (current time + 30 minutes)
      const createdAt = new Date(adRewardResult.rows[0].createdAt);
      const nextAvailable = new Date(createdAt.getTime() + COOLDOWN_MS);

      console.log('✅ Ad completed successfully');
      console.log('User:', userId);
      console.log('Watched at:', createdAt.toISOString());
      console.log('Next available:', nextAvailable.toISOString());
      console.log('Ads today:', adsWatchedToday);

      return NextResponse.json({
        success: true,
        message: `Successfully earned ${REWARD_AMOUNT} locked points!`,
        reward: REWARD_AMOUNT,
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
