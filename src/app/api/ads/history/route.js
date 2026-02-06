import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/ads/history
 * Returns user's ad reward history
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Fetch ad reward history (last 50 records)
    const result = await databaseHelpers.pool.query(
      `SELECT id, "userId", reward, "createdAt", status
       FROM ad_rewards 
       WHERE "userId" = $1 
       ORDER BY "createdAt" DESC 
       LIMIT 50`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      history: result.rows
    });

  } catch (error) {
    console.error('Error fetching ad history:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch ad history' }, { status: 500 });
  }
}
