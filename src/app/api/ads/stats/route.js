import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/ads/stats
 * Returns user's ad watching statistics and cooldown status
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Get today's start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get stats
    const statsResult = await databaseHelpers.pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE "createdAt" >= $2) as ads_today,
        MAX("createdAt") as last_watched
       FROM ad_rewards 
       WHERE "userId" = $1`,
      [userId, today]
    );

    const stats = statsResult.rows[0];
    const adsWatchedToday = parseInt(stats.ads_today || 0);
    const lastWatched = stats.last_watched;

    console.log('📊 Ad Stats for user:', userId);
    console.log('Ads today:', adsWatchedToday);
    console.log('Last watched:', lastWatched);

    // Calculate next available time
    let nextAdAvailable = null;
    if (lastWatched) {
      const lastAdTime = new Date(lastWatched).getTime();
      const now = Date.now();
      const nextAvailableTime = lastAdTime + COOLDOWN_MS;
      
      // Only return if still in cooldown
      if (now < nextAvailableTime) {
        nextAdAvailable = new Date(nextAvailableTime).toISOString();
        const minutesLeft = Math.ceil((nextAvailableTime - now) / 60000);
        console.log('⏳ Cooldown active:', minutesLeft, 'minutes remaining');
      } else {
        console.log('✅ Cooldown expired, can watch now');
      }
    } else {
      console.log('✅ No previous ads, can watch immediately');
    }

    return NextResponse.json({
      success: true,
      adsWatchedToday,
      nextAdAvailable
    });

  } catch (error) {
    console.error('Error fetching ad stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch ad stats' }, { status: 500 });
  }
}
