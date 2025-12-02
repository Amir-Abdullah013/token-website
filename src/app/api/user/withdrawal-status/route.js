import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/user/withdrawal-status
 * Get user's withdrawal eligibility status
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const firstDepositAmount = user.firstDepositAmount;
    const hasReferredOne = user.hasReferredOne || false;
    const referralCode = user.referralCode || user.id; // Fallback to user ID if no referral code

    // Determine withdrawal eligibility
    const isWithdrawalAllowed = firstDepositAmount === null || firstDepositAmount === undefined || firstDepositAmount >= 10 || hasReferredOne;
    const requiresReferral = firstDepositAmount !== null && firstDepositAmount !== undefined && firstDepositAmount < 10 && !hasReferredOne;

    return NextResponse.json({
      success: true,
      withdrawalStatus: {
        isAllowed: isWithdrawalAllowed,
        requiresReferral,
        firstDepositAmount,
        hasReferredOne,
        referralCode,
        message: requiresReferral 
          ? 'You must refer 1 user before withdrawing because your first deposit was below $10.'
          : firstDepositAmount !== null && firstDepositAmount < 10 && hasReferredOne
          ? 'You can withdraw! Your referral requirement is complete.'
          : firstDepositAmount === null || firstDepositAmount === undefined
          ? 'No deposit restrictions - you can withdraw normally.'
          : 'No referral is required to withdraw your funds.'
      }
    });

  } catch (error) {
    console.error('Error getting withdrawal status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve withdrawal status' },
      { status: 500 }
    );
  }
}


