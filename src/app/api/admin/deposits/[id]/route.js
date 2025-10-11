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

    const depositId = params.id;
    const depositRequest = await databaseHelpers.deposit.getDepositRequestById(depositId);

    if (!depositRequest) {
      return NextResponse.json(
        { success: false, error: 'Deposit request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      depositRequest
    });

  } catch (error) {
    console.error('Error fetching deposit request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deposit request' },
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

    const depositId = params.id;
    const { action, adminNotes } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get deposit request
    const depositRequest = await databaseHelpers.deposit.getDepositRequestById(depositId);
    if (!depositRequest) {
      return NextResponse.json(
        { success: false, error: 'Deposit request not found' },
        { status: 404 }
      );
    }

    if (depositRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Deposit request has already been processed' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'COMPLETED' : 'FAILED';

    // Update deposit request
    const updatedDepositRequest = await databaseHelpers.deposit.updateDepositRequest(depositId, {
      status: newStatus,
      adminNotes
    });

    // Update transaction status
    await databaseHelpers.transaction.updateTransactionStatus(depositRequest.transactionId, newStatus);

    // If approved, update user's balance
    if (action === 'approve') {
      await databaseHelpers.wallet.updateBalance(depositRequest.userId, depositRequest.amount);
      
      // Create notification for user
      await databaseHelpers.notification.createNotification({
        userId: depositRequest.userId,
        title: 'Deposit Approved',
        message: `Your deposit of $${depositRequest.amount} has been approved and added to your balance.`,
        type: 'SUCCESS'
      });
    } else {
      // Create notification for user about rejection
      await databaseHelpers.notification.createNotification({
        userId: depositRequest.userId,
        title: 'Deposit Rejected',
        message: `Your deposit of $${depositRequest.amount} has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''}`,
        type: 'ALERT'
      });
    }

    console.log(`✅ Deposit request ${action}d:`, {
      depositId,
      userId: depositRequest.userId,
      amount: depositRequest.amount,
      status: newStatus
    });

    return NextResponse.json({
      success: true,
      message: `Deposit request ${action}d successfully`,
      depositRequest: updatedDepositRequest
    });

  } catch (error) {
    console.error('Error updating deposit request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update deposit request' },
      { status: 500 }
    );
  }
}


