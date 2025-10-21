import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔍 Debug: Fetching withdrawal statistics...');
    
    // Get all withdrawal transactions
    const allWithdrawals = await databaseHelpers.transaction.getAllTransactions({
      type: 'WITHDRAW',
      page: 1,
      limit: 100
    });
    
    console.log('🔍 All withdrawal transactions:', allWithdrawals.data?.length || 0);
    console.log('🔍 Sample transactions:', allWithdrawals.data?.slice(0, 3));
    
    // Get statistics
    const stats = await databaseHelpers.transaction.getTransactionStats('WITHDRAW');
    console.log('🔍 Raw statistics:', stats);
    
    // Manual calculation to verify
    const transactions = allWithdrawals.data || [];
    const manualStats = {
      total: transactions.length,
      pending: transactions.filter(t => t.status === 'PENDING').length,
      completed: transactions.filter(t => t.status === 'COMPLETED').length,
      failed: transactions.filter(t => t.status === 'FAILED').length,
      totalAmount: transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
      totalPendingAmount: transactions.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
      totalCompletedAmount: transactions.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    };
    
    console.log('🔍 Manual calculation:', manualStats);
    
    return NextResponse.json({
      success: true,
      databaseStats: stats,
      manualStats: manualStats,
      transactions: transactions.slice(0, 5) // First 5 transactions for debugging
    });
    
  } catch (error) {
    console.error('❌ Debug withdrawal stats error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
