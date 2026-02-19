import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/ads/converter/check
 * Check if user is eligible to convert points to USD
 * Requirements:
 * - User must have referred 5 users
 * - Each of those 5 referrals must individually have at least 2000 points
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Get user's referrals with their individual ad points
    const referralsResult = await databaseHelpers.pool.query(
      `SELECT u.id, u.name, u.email,
              COALESCE(w."adPoints", w."lockedAdPoints", 0) as ad_points
       FROM users u
       LEFT JOIN wallets w ON w."userId" = u.id
       WHERE u."referrerId" = $1
       ORDER BY ad_points DESC`,
      [userId]
    );

    const referrals = referralsResult.rows;
    const referralCount = referrals.length;
    const REQUIRED_POINTS_PER_REFERRAL = 2000;
    const REQUIRED_REFERRALS = 5;

    // Count how many referrals individually have >= 2000 points
    const qualifiedReferrals = referrals.filter(r => parseFloat(r.ad_points) >= REQUIRED_POINTS_PER_REFERRAL);
    const qualifiedCount = qualifiedReferrals.length;

    // Check eligibility: need 5 referrals that EACH have >= 2000 points
    const hasEnoughReferrals = referralCount >= REQUIRED_REFERRALS;
    const hasEnoughQualifiedReferrals = qualifiedCount >= REQUIRED_REFERRALS;
    const isEligible = hasEnoughQualifiedReferrals;

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
        requiredReferrals: REQUIRED_REFERRALS,
        hasEnoughReferrals,
        qualifiedCount,
        hasEnoughQualifiedReferrals,
        requiredPointsPerReferral: REQUIRED_POINTS_PER_REFERRAL,
        // Per-referral breakdown for display
        referralDetails: referrals.map(r => ({
          id: r.id,
          name: r.name || 'User',
          email: r.email,
          adPoints: parseFloat(r.ad_points || 0),
          qualified: parseFloat(r.ad_points || 0) >= REQUIRED_POINTS_PER_REFERRAL
        }))
      },
      userAdPoints,
      conversionRate: 10000 / 0.36,
      pointsPerDollar: 10000 / 0.36,
      dollarsPerPoint: 0.36 / 10000
    });

  } catch (error) {
    console.error('Error checking converter eligibility:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check eligibility' 
    }, { status: 500 });
  }
}
