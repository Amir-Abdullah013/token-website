import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

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

    // Get current token price for converting USD fees to tokens
    let currentTokenPrice = 0.0035; // Default price
    try {
      const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
      currentTokenPrice = tokenValue.currentTokenValue;
    } catch (error) {
      console.warn('Could not get current token price, using default:', error.message);
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

    // Separate Token Fees (transfer only) from Dollar Fees (buy, sell, withdraw, wallet_fee)
    const tokenFeeTypes = ['transfer'];
    const dollarFeeTypes = ['buy', 'sell', 'withdraw', 'wallet_fee'];

    // Get Token Fees (in tokens) - ONLY transfer/send tokens
    // For transfer fees, feeAmount is already in tokens, not USD
    const tokenFeesQuery = `
      SELECT 
        "transactionType",
        COALESCE(SUM("feeAmount"), 0) as total_fees_tokens,
        COUNT(*) as transaction_count,
        COALESCE(AVG("feeAmount"), 0) as avg_fee_tokens
      FROM transactions 
      WHERE "feeAmount" > 0 
        AND "transactionType" = 'transfer'
        ${dateFilter}
      GROUP BY "transactionType"
      ORDER BY total_fees_tokens DESC
    `;

    const tokenFeesResult = await databaseHelpers.pool.query(tokenFeesQuery, params);
    const tokenFeesBreakdown = tokenFeesResult.rows.map(item => ({
      transactionType: item.transactionType,
      total_fees_tokens: parseFloat(item.total_fees_tokens),
      total_fees_usd: parseFloat(item.total_fees_tokens) * currentTokenPrice,
      transaction_count: parseInt(item.transaction_count),
      avg_fee_tokens: parseFloat(item.avg_fee_tokens),
      avg_fee_usd: parseFloat(item.avg_fee_tokens) * currentTokenPrice,
      fee_percentage: '5%'
    }));

    // Calculate total token fees
    const totalTokenFeesTokens = tokenFeesBreakdown.reduce((sum, item) => sum + item.total_fees_tokens, 0);
    const totalTokenFeesUsd = totalTokenFeesTokens * currentTokenPrice;
    const totalTokenTransactions = tokenFeesBreakdown.reduce((sum, item) => sum + item.transaction_count, 0);

    // Get Dollar Fees (buy, sell, withdraw + wallet_fee)
    const dollarFeesQuery = `
      SELECT 
        "transactionType",
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as transaction_count,
        COALESCE(AVG("feeAmount"), 0) as avg_fee
      FROM transactions 
      WHERE "feeAmount" > 0 
        AND ("transactionType" IN ('buy', 'sell', 'withdraw') OR type = 'WALLET_FEE')
        ${dateFilter}
      GROUP BY "transactionType"
      ORDER BY total_fees DESC
    `;

    const dollarFeesResult = await databaseHelpers.pool.query(dollarFeesQuery, params);
    const dollarFeesBreakdown = dollarFeesResult.rows.map(item => ({
      transactionType: item.transactionType || 'wallet_fee',
      total_fees: parseFloat(item.total_fees),
      transaction_count: parseInt(item.transaction_count),
      avg_fee: parseFloat(item.avg_fee),
      fee_percentage: item.transactionType === 'withdraw' ? '10%' : 
                     item.transactionType === 'buy' ? '1%' :
                     item.transactionType === 'sell' ? '1%' : '$2 fixed'
    }));

    // Also capture WALLET_FEE transactions by type field
    const walletFeeQuery = `
      SELECT 
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as transaction_count,
        COALESCE(AVG("feeAmount"), 0) as avg_fee
      FROM transactions 
      WHERE type = 'WALLET_FEE' 
        AND "feeAmount" > 0 
        ${dateFilter}
    `;

    const walletFeeResult = await databaseHelpers.pool.query(walletFeeQuery, params);
    if (walletFeeResult.rows[0] && parseFloat(walletFeeResult.rows[0].total_fees) > 0) {
      const walletFeeData = walletFeeResult.rows[0];
      dollarFeesBreakdown.push({
        transactionType: 'wallet_fee',
        total_fees: parseFloat(walletFeeData.total_fees),
        transaction_count: parseInt(walletFeeData.transaction_count),
        avg_fee: parseFloat(walletFeeData.avg_fee),
        fee_percentage: '$2 fixed'
      });
    }

    // Calculate total dollar fees
    const totalDollarFees = dollarFeesBreakdown.reduce((sum, item) => sum + item.total_fees, 0);
    const totalDollarTransactions = dollarFeesBreakdown.reduce((sum, item) => sum + item.transaction_count, 0);

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
        type,
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
      wallet_fee: 2,   // $2 fixed
    };

    // Add fee rate information to breakdown (for backward compatibility)
    const breakdownWithRates = breakdown.map(item => ({
      ...item,
      fee_rate: feeRates[item.transactionType] || 0,
      fee_percentage: ((feeRates[item.transactionType] || 0) * 100).toFixed(1) + '%'
    }));

    const summary = {
      total_fees: parseFloat(totalFees.total_fees),
      total_transactions: parseInt(totalFees.total_transactions),
      breakdown: breakdownWithRates,
      
      // NEW: Token Fees Section
      token_fees: {
        total_fees_tokens: totalTokenFeesTokens,
        total_fees_usd: totalTokenFeesUsd,
        total_transactions: totalTokenTransactions,
        breakdown: tokenFeesBreakdown,
        current_token_price: currentTokenPrice
      },
      
      // NEW: Dollar Fees Section
      dollar_fees: {
        total_fees: totalDollarFees,
        total_transactions: totalDollarTransactions,
        breakdown: dollarFeesBreakdown
      },
      
      daily_fees: dailyFees,
      top_transactions: topTransactions,
      date_range: {
        start: startDate,
        end: endDate,
        type: transactionType
      }
    };

    console.log('✅ Admin Fees Summary API: Successfully fetched fee statistics');
    console.log('📊 Token Fees:', totalTokenFeesTokens.toFixed(2), 'tokens');
    console.log('💵 Dollar Fees:', totalDollarFees.toFixed(2), 'USD');

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
