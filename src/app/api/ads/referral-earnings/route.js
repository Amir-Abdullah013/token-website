import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/ads/referral-earnings
 * Returns the total ad points earned as a referrer from the ad_rewards table.
 * No longer reads from the transactions table (AD_REWARD rows have been removed).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Read directly from the summary row in ad_rewards
    const result = await databaseHelpers.pool.query(
      `SELECT
         COALESCE("referralPoints", 0)::FLOAT as total_earnings,
         COALESCE("adsWatched", 0) as total_referral_ads
       FROM ad_rewards
       WHERE "userId" = $1`,
      [userId]
    );

    const totalEarnings = result.rows[0]?.total_earnings || 0;
    const totalReferralAds = result.rows[0]?.total_referral_ads || 0;

    return NextResponse.json({
      success: true,
      totalEarnings,
      totalReferralAds,
      recentEarnings: [] // No longer stored per-row; historical detail not available
    });

  } catch (error) {
    console.error('Error fetching referral ad earnings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch referral earnings' }, { status: 500 });
  }
}
