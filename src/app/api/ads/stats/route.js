import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/ads/stats
 * Returns user's ad watching statistics and cooldown status.
 * Reads from the single-row-per-user ad_rewards table.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes

    // Single-row lookup per user
    const statsResult = await databaseHelpers.pool.query(
      `SELECT "adsWatched", "totalPoints", "lastWatchedAt"
       FROM ad_rewards
       WHERE "userId" = $1`,
      [userId]
    );

    const row = statsResult.rows[0];
    const adsWatchedToday = row ? parseInt(row.adsWatched || 0) : 0;
    const lastWatched = row ? row.lastWatchedAt : null;

    // Calculate next available time
    let nextAdAvailable = null;
    if (lastWatched) {
      const lastAdTime = new Date(lastWatched).getTime();
      const now = Date.now();
      const nextAvailableTime = lastAdTime + COOLDOWN_MS;
      if (now < nextAvailableTime) {
        nextAdAvailable = new Date(nextAvailableTime).toISOString();
      }
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
