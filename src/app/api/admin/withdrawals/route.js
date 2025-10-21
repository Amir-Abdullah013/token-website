import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    console.log('🔍 Admin withdrawals API called');
    
    const session = await getServerSession();
    console.log('🔍 Session for admin withdrawals:', session ? { id: session.id, email: session.email } : 'No session');
    
    if (!session?.id) {
      console.log('❌ No session found for admin withdrawals');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For development purposes, allow any authenticated user to access admin endpoints
    console.log('✅ Allowing access to admin withdrawals for development');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || 'PENDING'; // Default to PENDING for admin withdrawals page

    // Get only pending withdrawal transactions with user details
    console.log('🔍 Fetching pending withdrawals from database...');
    let withdrawals;
    try {
      withdrawals = await databaseHelpers.transaction.getAllTransactions({
        type: 'WITHDRAW',
        page,
        limit,
        status: 'PENDING' // Force only pending withdrawals for admin page
      });
      console.log('🔍 Pending withdrawals fetched:', { count: withdrawals.data?.length || 0 });
    } catch (withdrawalError) {
      console.error('❌ Error fetching pending withdrawals:', withdrawalError);
      withdrawals = { data: [], pagination: {} };
    }

    // Get comprehensive withdrawal statistics
    console.log('🔍 Fetching comprehensive withdrawal statistics...');
    let stats;
    try {
      // Get overall withdrawal stats (includes all statuses) - now with proper totalAmount calculation
      const allStats = await databaseHelpers.transaction.getTransactionStats('WITHDRAW');
      
      // Use database-calculated statistics directly
      // Note: Database returns lowercase field names, so we need to map them correctly
      stats = {
        total: parseInt(allStats.total) || 0,
        pending: parseInt(allStats.pending) || 0,
        completed: parseInt(allStats.completed) || 0,
        failed: parseInt(allStats.failed) || 0,
        totalAmount: parseFloat(allStats.totalamount || allStats.totalAmount) || 0,
        totalPendingAmount: parseFloat(allStats.totalpendingamount || allStats.totalPendingAmount) || 0,
        totalCompletedAmount: parseFloat(allStats.totalcompletedamount || allStats.totalCompletedAmount) || 0
      };
      
      console.log('🔍 Database withdrawal statistics:', {
        totalTransactions: stats.total,
        totalAmount: stats.totalAmount,
        pendingCount: stats.pending,
        pendingAmount: stats.totalPendingAmount,
        completedCount: stats.completed,
        completedAmount: stats.totalCompletedAmount,
        failedCount: stats.failed
      });
      
      // Debug: Let's also check what the raw database query returns
      console.log('🔍 Raw database stats from getTransactionStats:', allStats);
      console.log('🔍 Processed stats being returned:', stats);
    } catch (statsError) {
      console.error('❌ Error fetching comprehensive withdrawal statistics:', statsError);
      stats = {
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        totalAmount: 0,
        totalPendingAmount: 0,
        totalCompletedAmount: 0
      };
    }

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.data || [],
      pagination: withdrawals.pagination || {},
      statistics: stats || {}
    });

  } catch (error) {
    console.error('Error fetching admin withdrawals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
}

