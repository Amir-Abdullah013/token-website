import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../../../lib/session';
import { databaseHelpers } from '../../../../../../lib/database';

// Update transaction status
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

    const transactionId = params.id;
    const { status } = await request.json();

    if (!status || !['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be "PENDING", "COMPLETED", or "FAILED"' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const existingTransaction = await databaseHelpers.transaction.getTransactionById(transactionId);
    if (!existingTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction status using database helper
    const updatedTransaction = await databaseHelpers.transaction.updateTransactionStatus(transactionId, status);

    console.log('✅ Transaction status updated successfully:', {
      transactionId,
      status,
      updatedTransaction: updatedTransaction ? 'success' : 'failed'
    });

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: `Transaction status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating transaction status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction status' },
      { status: 500 }
    );
  }
}
