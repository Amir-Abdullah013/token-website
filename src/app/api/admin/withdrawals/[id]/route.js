import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../../lib/session';
import { databaseHelpers } from '../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const withdrawalId = params.id;
    const transaction = await databaseHelpers.transaction.getTransactionById(withdrawalId);

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Error fetching withdrawal request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const withdrawalId = params.id;
    const { action, adminNotes } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get withdrawal transaction
    const transaction = await databaseHelpers.transaction.getTransactionById(withdrawalId);
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Withdrawal request has already been processed' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'COMPLETED' : 'FAILED';

    // Update transaction status
    await databaseHelpers.transaction.updateTransactionStatus(withdrawalId, newStatus);

    if (action === 'approve') {
      // Create success notification for user
      await databaseHelpers.notification.createNotification({
        userId: transaction.userId,
        title: 'Withdrawal Approved',
        message: `Your withdrawal of $${transaction.amount} has been successfully deposited to your Binance account.`,
        type: 'SUCCESS'
      });
    } else {
      // Refund the amount to user's balance
      await databaseHelpers.wallet.updateBalance(transaction.userId, transaction.amount);
      
      // Create rejection notification for user
      await databaseHelpers.notification.createNotification({
        userId: transaction.userId,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request of $${transaction.amount} has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''} The amount has been refunded to your balance.`,
        type: 'ALERT'
      });
    }

    console.log(`✅ Withdrawal request ${action}d:`, {
      withdrawalId,
      userId: transaction.userId,
      amount: transaction.amount,
      status: newStatus
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal request ${action}d successfully`,
      transaction: {
        id: withdrawalId,
        status: newStatus
      }
    });

  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update withdrawal request' },
      { status: 500 }
    );
  }
}







