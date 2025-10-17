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

    const { id: depositId } = await params;
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

    const { id: depositId } = await params;
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

    // Update ALL PENDING deposit transactions for this user with matching amount
    // This ensures we catch the right transaction even if there are multiple deposits
    try {
      console.log(`🔄 Updating transactions for user ${depositRequest.userId}, amount $${depositRequest.amount}`);
      
      const transactionResult = await databaseHelpers.pool.query(`
        UPDATE transactions
        SET status = $1, "updatedAt" = NOW()
        WHERE "userId" = $2 
          AND type = 'DEPOSIT'
          AND amount = $3
          AND status = 'PENDING'
        RETURNING id, status, "createdAt"
      `, [newStatus, depositRequest.userId, depositRequest.amount]);
      
      if (transactionResult.rows.length > 0) {
        console.log(`✅ Updated ${transactionResult.rows.length} transaction(s):`);
        transactionResult.rows.forEach(tx => {
          console.log(`   ${tx.id} - ${tx.status} - ${new Date(tx.createdAt).toLocaleString()}`);
        });
      } else {
        console.warn(`⚠️ No PENDING deposit transactions found for user ${depositRequest.userId} with amount $${depositRequest.amount}`);
        
        // Debug: Show all transactions for this user
        const debugTxs = await databaseHelpers.pool.query(`
          SELECT id, type, amount, status, "createdAt"
          FROM transactions
          WHERE "userId" = $1
          ORDER BY "createdAt" DESC
          LIMIT 10
        `, [depositRequest.userId]);
        
        console.log(`   User has ${debugTxs.rows.length} transactions:`);
        debugTxs.rows.forEach(tx => {
          console.log(`     ${tx.id} - ${tx.type} - $${tx.amount} - ${tx.status} - ${new Date(tx.createdAt).toLocaleString()}`);
        });
      }
    } catch (txError) {
      console.error('Error updating transaction status:', txError);
      // Don't fail the whole request if transaction update fails
    }

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







