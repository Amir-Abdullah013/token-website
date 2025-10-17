import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/admin/fee-stats
 * Get fee statistics and analytics
 */
export async function GET() {
  try {
    // Get fee statistics
    const feeStats = await databaseHelpers.transactionWithFees.getFeeStats();
    
    // Get current fee configuration
    const feeConfig = await databaseHelpers.feeConfig.getFeeConfig();
    
    // Calculate additional metrics
    const totalFeesCollected = parseFloat(feeStats.totalFeesCollected) || 0;
    const totalTransactionsWithFees = parseInt(feeStats.totalTransactionsWithFees) || 0;
    const averageFeeAmount = parseFloat(feeStats.averageFeeAmount) || 0;
    
    // Get recent transactions with fees
    const recentTransactions = await databaseHelpers.transaction.getAllTransactions({
      type: null,
      page: 1,
      limit: 10
    });

    // Filter transactions with fees
    const transactionsWithFees = recentTransactions.data.filter(tx => tx.feeAmount > 0);

    return NextResponse.json({
      success: true,
      data: {
        // Fee statistics
        totalFeesCollected,
        totalTransactionsWithFees,
        averageFeeAmount,
        lastFeeCollection: feeStats.lastFeeCollection,
        
        // Current configuration
        currentFeeRate: feeConfig?.transactionFeeRate || 0.05,
        feeReceiverId: feeConfig?.feeReceiverId || 'ADMIN_WALLET',
        isActive: feeConfig?.isActive !== false,
        
        // Recent activity
        recentTransactionsWithFees: transactionsWithFees.slice(0, 5),
        
        // Calculated metrics
        totalFeesInUSD: totalFeesCollected,
        feeRatePercentage: ((feeConfig?.transactionFeeRate || 0.05) * 100).toFixed(2),
        
        // Summary
        summary: {
          totalFeesCollected: `$${totalFeesCollected.toFixed(2)}`,
          totalTransactions: totalTransactionsWithFees,
          averageFee: `$${averageFeeAmount.toFixed(2)}`,
          feeRate: `${((feeConfig?.transactionFeeRate || 0.05) * 100).toFixed(2)}%`,
          status: feeConfig?.isActive !== false ? 'Active' : 'Inactive'
        }
      }
    });
  } catch (error) {
    console.error('Error getting fee stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get fee statistics' },
      { status: 500 }
    );
  }
}







