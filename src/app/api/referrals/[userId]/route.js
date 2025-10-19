import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = await params;

    // Check if user is requesting their own data or is an admin
    if (session.id !== userId && session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view this data' },
        { status: 403 }
      );
    }

    // Verify the user exists
    const user = await databaseHelpers.user.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get comprehensive referral data using efficient joins
    const referralData = await databaseHelpers.referralEarning.getReferralAnalytics(userId);

    // Format the response data
    const referrals = referralData.map(row => ({
      referredUser: row.referredId,
      referredName: row.referred_name,
      referredEmail: row.referred_email,
      signupDate: row.signup_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      stakingProfit: parseFloat(row.total_staking_profit) || 0,
      earningFromThisUser: parseFloat(row.total_earnings_from_user) || 0
    }));

    const totalEarnings = referralData.length > 0 
      ? parseFloat(referralData[0].total_referral_earnings) || 0
      : 0;

    // Calculate additional statistics
    const totalStakingProfit = referrals.reduce((sum, ref) => sum + ref.stakingProfit, 0);
    const totalEarningsFromReferrals = referrals.reduce((sum, ref) => sum + ref.earningFromThisUser, 0);

    return NextResponse.json({
      success: true,
      userId: userId,
      totalEarnings: totalEarnings,
      referrals: referrals,
      referralCount: referrals.length,
      statistics: {
        totalStakingProfitFromReferrals: totalStakingProfit,
        totalEarningsFromReferrals: totalEarningsFromReferrals,
        averageEarningPerReferral: referrals.length > 0 ? totalEarningsFromReferrals / referrals.length : 0
      }
    });

  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}
