import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/ads/referral-earnings
 * Returns the total ad points earned from referrals
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Get all transactions where this user received ad rewards from their referrals
    const earningsResult = await databaseHelpers.pool.query(
      `SELECT 
        SUM(amount) as total_earnings,
        COUNT(*) as total_referral_ads
       FROM transactions 
       WHERE "userId" = $1 
       AND type = 'AD_REWARD'
       AND description LIKE '%Referral ad bonus%'
       AND status = 'COMPLETED'`,
      [userId]
    );

    const totalEarnings = parseFloat(earningsResult.rows[0]?.total_earnings || 0);
    const totalReferralAds = parseInt(earningsResult.rows[0]?.total_referral_ads || 0);

    // Get recent referral ad earnings
    const recentResult = await databaseHelpers.pool.query(
      `SELECT amount, "createdAt", description
       FROM transactions 
       WHERE "userId" = $1 
       AND type = 'AD_REWARD'
       AND description LIKE '%Referral ad bonus%'
       AND status = 'COMPLETED'
       ORDER BY "createdAt" DESC
       LIMIT 10`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      totalEarnings,
      totalReferralAds,
      recentEarnings: recentResult.rows
    });

  } catch (error) {
    console.error('Error fetching referral ad earnings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch referral earnings' }, { status: 500 });
  }
}
