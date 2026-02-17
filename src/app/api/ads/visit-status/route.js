import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ads/visit-status
 * Checks when the next visit reward is available
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const COOLDOWN = 30 * 60 * 1000; // 30 minutes

    // Check last visit reward
    const lastReward = await databaseHelpers.pool.query(
      `SELECT "createdAt" FROM transactions
       WHERE "userId" = $1
       AND description LIKE '%page_visit%'
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [userId]
    );

    let nextAvailableAt = null;
    let available = true;
    let remainingSeconds = 0;

    if (lastReward.rows.length > 0) {
      const lastTime = new Date(lastReward.rows[0].createdAt).getTime();
      const now = Date.now();
      const diff = now - lastTime;

      if (diff < COOLDOWN) {
        available = false;
        nextAvailableAt = new Date(lastTime + COOLDOWN).toISOString();
        remainingSeconds = Math.ceil((COOLDOWN - diff) / 1000);
      }
    }

    return NextResponse.json({
      success: true,
      available,
      nextAvailableAt,
      remainingSeconds
    });

  } catch (error) {
    console.error('Error checking visit status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check visit status' 
    }, { status: 500 });
  }
}
