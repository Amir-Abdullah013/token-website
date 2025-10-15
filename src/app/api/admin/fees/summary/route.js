import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../../lib/session';
import { databaseHelpers } from '../../../../../lib/database';

export async function GET(request) {
  try {
    console.log('📊 Admin Fees Summary API: Fetching fee statistics');

    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check if user is admin
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user || (user.role !== 'ADMIN' && !user.isAdmin)) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Get date range from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const transactionType = searchParams.get('type');

    // Build date filter
    let dateFilter = '';
    let params = [];
    let paramCount = 0;

    if (startDate) {
      paramCount++;
      dateFilter += ` AND "createdAt" >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      dateFilter += ` AND "createdAt" <= $${paramCount}`;
      params.push(endDate);
    }

    if (transactionType) {
      paramCount++;
      dateFilter += ` AND "transactionType" = $${paramCount}`;
      params.push(transactionType);
    }

    // Get total fees collected
    const totalFeesQuery = `
      SELECT 
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE "feeAmount" > 0 ${dateFilter}
    `;

    const totalFeesResult = await databaseHelpers.pool.query(totalFeesQuery, params);
    const totalFees = totalFeesResult.rows[0];

    // Get fees breakdown by transaction type
    const breakdownQuery = `
      SELECT 
        "transactionType",
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as transaction_count,
        COALESCE(AVG("feeAmount"), 0) as avg_fee
      FROM transactions 
      WHERE "feeAmount" > 0 ${dateFilter}
      GROUP BY "transactionType"
      ORDER BY total_fees DESC
    `;

    const breakdownResult = await databaseHelpers.pool.query(breakdownQuery, params);
    const breakdown = breakdownResult.rows;

    // Get daily fee collection for the last 30 days
    const dailyQuery = `
      SELECT 
        DATE("createdAt") as date,
        COALESCE(SUM("feeAmount"), 0) as daily_fees,
        COUNT(*) as daily_transactions
      FROM transactions 
      WHERE "feeAmount" > 0 
        AND "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `;

    const dailyResult = await databaseHelpers.pool.query(dailyQuery);
    const dailyFees = dailyResult.rows;

    // Get top fee-generating transactions
    const topTransactionsQuery = `
      SELECT 
        id,
        "userId",
        "transactionType",
        amount,
        "feeAmount",
        "netAmount",
        "createdAt"
      FROM transactions 
      WHERE "feeAmount" > 0 ${dateFilter}
      ORDER BY "feeAmount" DESC
      LIMIT 10
    `;

    const topTransactionsResult = await databaseHelpers.pool.query(topTransactionsQuery, params);
    const topTransactions = topTransactionsResult.rows;

    // Calculate fee rates by type
    const feeRates = {
      transfer: 0.05,  // 5%
      withdraw: 0.10,  // 10%
      buy: 0.01,       // 1%
      sell: 0.01,      // 1%
    };

    // Add fee rate information to breakdown
    const breakdownWithRates = breakdown.map(item => ({
      ...item,
      fee_rate: feeRates[item.transactionType] || 0,
      fee_percentage: ((feeRates[item.transactionType] || 0) * 100).toFixed(1) + '%'
    }));

    const summary = {
      total_fees: parseFloat(totalFees.total_fees),
      total_transactions: parseInt(totalFees.total_transactions),
      breakdown: breakdownWithRates,
      daily_fees: dailyFees,
      top_transactions: topTransactions,
      date_range: {
        start: startDate,
        end: endDate,
        type: transactionType
      }
    };

    console.log('✅ Admin Fees Summary API: Successfully fetched fee statistics');

    return NextResponse.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('❌ Admin Fees Summary API: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch fee statistics',
      details: error.message
    }, { status: 500 });
  }
}
