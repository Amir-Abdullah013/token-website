import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/admin/ads/all
 * Returns all ad rewards summary — one row per user with cumulative stats.
 * Admin only endpoint.
 */
export async function GET(request) {
  try {
    const result = await databaseHelpers.pool.query(
      `SELECT 
        ar.id,
        ar."userId",
        ar."totalPoints"::FLOAT as "totalPoints",
        ar."referralPoints"::FLOAT as "referralPoints",
        ar."adsWatched",
        ar."lastWatchedAt",
        ar.status,
        ar."createdAt",
        ar."updatedAt",
        u.name as "userName",
        u.email as "userEmail"
       FROM ad_rewards ar
       LEFT JOIN users u ON ar."userId" = u.id
       ORDER BY ar."totalPoints" DESC
       LIMIT 500`
    );

    const rewards = result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      totalPoints: row.totalPoints,
      referralPoints: row.referralPoints,
      adsWatched: row.adsWatched,
      lastWatchedAt: row.lastWatchedAt,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        name: row.userName,
        email: row.userEmail
      }
    }));

    return NextResponse.json({
      success: true,
      rewards
    });

  } catch (error) {
    console.error('Error fetching all ad rewards:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch ad rewards' 
    }, { status: 500 });
  }
}
