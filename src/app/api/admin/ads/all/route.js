import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/admin/ads/all
 * Returns all ad rewards with user information
 * Admin only endpoint
 */
export async function GET(request) {
  try {
    // TODO: Add admin authentication check
    // const session = await getSession(request);
    // if (!session || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    // }

    // Fetch all ad rewards with user information
    const result = await databaseHelpers.pool.query(
      `SELECT 
        ar.id,
        ar."userId",
        ar.reward,
        ar.status,
        ar."adTransactionId",
        ar."adProvider",
        ar."adType",
        ar."createdAt",
        ar."updatedAt",
        u.name as "userName",
        u.email as "userEmail"
       FROM ad_rewards ar
       LEFT JOIN users u ON ar."userId" = u.id
       ORDER BY ar."createdAt" DESC
       LIMIT 500`
    );

    // Format the response
    const rewards = result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      reward: row.reward,
      status: row.status,
      adTransactionId: row.adTransactionId,
      adProvider: row.adProvider,
      adType: row.adType,
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
