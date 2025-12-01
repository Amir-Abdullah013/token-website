import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/admin/reserve-history
 * Get admin reserve history with filters
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details to check admin status
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    const isAdmin = user.role === 'ADMIN' || user.role === 'admin' || user.isAdmin === true;
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const transactionType = searchParams.get('transactionType');
    const userId = searchParams.get('userId');
    const adminId = searchParams.get('adminId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 100;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Build filters
    const filters = {};
    if (transactionType) filters.transactionType = transactionType;
    if (userId) filters.userId = userId;
    if (adminId) filters.adminId = adminId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    filters.limit = limit;
    filters.offset = offset;

    // Get reserve history
    const history = await databaseHelpers.adminReserveHistory.getReserveHistory(filters);

    // Get statistics
    const stats = await databaseHelpers.adminReserveHistory.getReserveHistoryStats({
      startDate: startDate || null,
      endDate: endDate || null,
      transactionType: transactionType || null
    });

    // Get current reserve
    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    const currentReserve = tokenSupply ? Number(tokenSupply.adminReserve) : 0;

    return NextResponse.json({
      success: true,
      data: {
        history: history.map(item => ({
          id: item.id,
          transactionType: item.transactionType,
          amount: Number(item.amount),
          purpose: item.purpose,
          userId: item.userId,
          userName: item.user_name,
          userEmail: item.user_email,
          adminId: item.adminId,
          adminName: item.admin_name,
          adminEmail: item.admin_email,
          reserveBefore: Number(item.reserveBefore),
          reserveAfter: Number(item.reserveAfter),
          referenceId: item.referenceId,
          referenceType: item.referenceType,
          createdAt: item.createdAt
        })),
        stats: {
          totalTransactions: parseInt(stats.total_transactions || 0),
          totalAdded: Number(stats.total_added || 0),
          totalRemoved: Number(stats.total_removed || 0),
          firstTransaction: stats.first_transaction,
          lastTransaction: stats.last_transaction,
          uniqueAdmins: parseInt(stats.unique_admins || 0),
          uniqueUsers: parseInt(stats.unique_users || 0)
        },
        currentReserve: currentReserve,
        pagination: {
          limit,
          offset,
          count: history.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting admin reserve history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve admin reserve history' },
      { status: 500 }
    );
  }
}


