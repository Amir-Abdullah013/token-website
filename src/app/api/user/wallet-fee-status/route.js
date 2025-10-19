import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database.js';

/**
 * Get wallet fee status for the authenticated user
 * Returns fee status, due date, and days remaining
 */
export async function GET(request) {
  try {
    // Get session
    const session = await getServerSession();
    
    if (!session?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.id;

    // Get wallet fee status
    const feeStatus = await databaseHelpers.walletFee.getWalletFeeStatus(userId);
    
    if (!feeStatus) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const dueDate = feeStatus.walletFeeDueAt ? new Date(feeStatus.walletFeeDueAt) : null;
    
    // Calculate days remaining
    let daysRemaining = 0;
    let isPending = false;
    
    if (dueDate && !feeStatus.walletFeeProcessed) {
      const timeDiff = dueDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
      isPending = daysRemaining > 0;
    }

    return NextResponse.json({
      userId,
      walletFeeDueAt: feeStatus.walletFeeDueAt,
      walletFeeProcessed: feeStatus.walletFeeProcessed,
      walletFeeWaived: feeStatus.walletFeeWaived,
      walletFeeLocked: feeStatus.walletFeeLocked,
      walletFeeProcessedAt: feeStatus.walletFeeProcessedAt,
      daysRemaining,
      isPending,
      feeAmount: 2 // $2 fee amount
    });

  } catch (error) {
    console.error('Error fetching wallet fee status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch wallet fee status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

