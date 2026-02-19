import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/admin/ads/stats
 * Returns aggregated statistics for ad rewards
 * Admin only endpoint
 */
export async function GET(request) {
  try {
    // TODO: Add admin authentication check
    // const session = await getSession(request);
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    // }

    // Get today's start time
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch total statistics from the single-row-per-user ad_rewards table
    const totalStatsResult = await databaseHelpers.pool.query(
      `SELECT 
        COUNT(*) as total_users,
        COALESCE(SUM("adsWatched"), 0) as total_rewards,
        COALESCE(SUM("totalPoints"), 0) as total_tokens
       FROM ad_rewards`
    );

    // Today's active users (watched an ad today)
    const todayStatsResult = await databaseHelpers.pool.query(
      `SELECT 
        COUNT(*) as today_users,
        COALESCE(SUM("adsWatched"), 0) as today_rewards
       FROM ad_rewards
       WHERE "lastWatchedAt" >= $1`,
      [today]
    );

    const totalStats = totalStatsResult.rows[0];
    const todayStats = todayStatsResult.rows[0];

    return NextResponse.json({
      success: true,
      stats: {
        totalRewards: parseInt(totalStats.total_rewards || 0),
        totalTokensDistributed: parseFloat(totalStats.total_tokens || 0),
        totalUsers: parseInt(totalStats.total_users || 0),
        todayRewards: parseInt(todayStats.today_rewards || 0),
        todayTokens: 0 // Not tracked daily anymore (cumulative only)
      }
    });

  } catch (error) {
    console.error('Error fetching ad stats:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch ad statistics' 
    }, { status: 500 });
  }
}
