import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('Quick stats API called with userId:', userId);

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's trading statistics
    let totalTrades = 0;
    let totalProfit = 0;
    let activeOrders = 0;
    let successRate = 0;

    try {
      // Get total trades (buy + sell transactions)
      const tradesResult = await databaseHelpers.pool.query(`
        SELECT COUNT(*) as count
        FROM transactions 
        WHERE "userId" = $1 AND type IN ('BUY', 'SELL')
      `, [userId]);
      totalTrades = parseInt(tradesResult.rows[0].count) || 0;

      // Get total profit (difference between sell and buy amounts)
      const profitResult = await databaseHelpers.pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'SELL' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as totalSells,
          COALESCE(SUM(CASE WHEN type = 'BUY' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as totalBuys
        FROM transactions 
        WHERE "userId" = $1 AND type IN ('BUY', 'SELL')
      `, [userId]);
      
      const totalSells = parseFloat(profitResult.rows[0].totalSells) || 0;
      const totalBuys = parseFloat(profitResult.rows[0].totalBuys) || 0;
      totalProfit = totalSells - totalBuys;

      // Get active orders (pending transactions)
      const activeOrdersResult = await databaseHelpers.pool.query(`
        SELECT COUNT(*) as count
        FROM transactions 
        WHERE "userId" = $1 AND status = 'PENDING'
      `, [userId]);
      activeOrders = parseInt(activeOrdersResult.rows[0].count) || 0;

      // Calculate success rate (completed transactions / total transactions)
      const successResult = await databaseHelpers.pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed
        FROM transactions 
        WHERE "userId" = $1
      `, [userId]);
      
      const totalTransactions = parseInt(successResult.rows[0].total) || 0;
      const completedTransactions = parseInt(successResult.rows[0].completed) || 0;
      successRate = totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 0;

    } catch (error) {
      console.error('Error getting quick stats:', error);
      // Return default values on error
    }

    const quickStats = {
      totalTrades,
      totalProfit,
      activeOrders,
      successRate
    };

    console.log('Returning quick stats:', quickStats);

    return NextResponse.json(quickStats);

  } catch (error) {
    console.error('Error getting quick stats:', error);
    
    // Return fallback data instead of error
    return NextResponse.json({
      totalTrades: 0,
      totalProfit: 0,
      activeOrders: 0,
      successRate: 0
    });
  }
}


