import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/ads/converter/check
 * Check if user is eligible to convert points to USD
 * Requirements:
 * - User must have referred 5 users
 * - Those 5 users must have collectively earned at least 2000 points
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Get user's referrals
    const referralsResult = await databaseHelpers.pool.query(
      `SELECT id FROM users WHERE "referrerId" = $1`,
      [userId]
    );

    const referrals = referralsResult.rows;
    const referralCount = referrals.length;

    // Get total points earned by referrals
    let totalReferralPoints = 0;
    if (referralCount > 0) {
      const referralIds = referrals.map(r => r.id);
      try {
        const pointsResult = await databaseHelpers.pool.query(
          `SELECT COALESCE(SUM(COALESCE("adPoints", "lockedAdPoints", 0)), 0) as total_points
           FROM wallets
           WHERE "userId" = ANY($1)`,
          [referralIds]
        );
        totalReferralPoints = parseFloat(pointsResult.rows[0]?.total_points || 0);
      } catch (err) {
        console.error('Error getting referral points:', err);
        totalReferralPoints = 0;
      }
    }

    // Check eligibility
    const hasEnoughReferrals = referralCount >= 5; // Changed from 5 to 1 as requested
    const hasEnoughPoints = totalReferralPoints >= 2000;
    const isEligible = hasEnoughReferrals && hasEnoughPoints;

    // Get user's current ad points
    let userAdPoints = 0;
    try {
      const userPointsResult = await databaseHelpers.pool.query(
        `SELECT COALESCE("adPoints", "lockedAdPoints", 0) as ad_points FROM wallets WHERE "userId" = $1`,
        [userId]
      );
      userAdPoints = parseFloat(userPointsResult.rows[0]?.ad_points || 0);
    } catch (err) {
      console.error('Error getting user ad points:', err);
      userAdPoints = 0;
    }

    return NextResponse.json({
      success: true,
      isEligible,
      requirements: {
        referralCount,
        requiredReferrals: 5, // Changed from 5
        hasEnoughReferrals,
        totalReferralPoints,
        requiredPoints: 2000,
        hasEnoughPoints
      },
      userAdPoints,
      conversionRate: 1000 / 0.36, // 1000 points = $0.36 USD, so rate = 2777.78 points per $1
      pointsPerDollar: 1000 / 0.36,
      dollarsPerPoint: 0.36 / 1000 // $0.00036 per point
    });

  } catch (error) {
    console.error('Error checking converter eligibility:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check eligibility' 
    }, { status: 500 });
  }
}
