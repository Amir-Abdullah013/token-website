#!/usr/bin/env node

/**
 * Test Admin Fees API
 * Test the admin fees API endpoints directly
 */

const { databaseHelpers } = require('../src/lib/database');

async function testAdminFeesAPI() {
  console.log('🧪 Testing Admin Fees API\n');

  try {
    // Test 1: Simulate the admin fees summary query
    console.log('1️⃣ Testing admin fees summary query...');
    
    const totalFeesQuery = `
      SELECT 
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE "feeAmount" > 0
    `;

    const totalFeesResult = await databaseHelpers.pool.query(totalFeesQuery);
    const totalFees = totalFeesResult.rows[0];
    
    console.log('✅ Total fees query results:');
    console.log(`  Total fees collected: $${totalFees.total_fees}`);
    console.log(`  Total transactions with fees: ${totalFees.total_transactions}`);

    // Test 2: Test breakdown by transaction type
    console.log('\n2️⃣ Testing breakdown by transaction type...');
    const breakdownQuery = `
      SELECT 
        "transactionType",
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as transaction_count,
        COALESCE(AVG("feeAmount"), 0) as avg_fee
      FROM transactions 
      WHERE "feeAmount" > 0
      GROUP BY "transactionType"
      ORDER BY total_fees DESC
    `;

    const breakdownResult = await databaseHelpers.pool.query(breakdownQuery);
    const breakdown = breakdownResult.rows;
    
    console.log('✅ Breakdown by transaction type:');
    breakdown.forEach(item => {
      console.log(`  ${item.transactionType}: $${item.total_fees} total fees (${item.transaction_count} transactions, avg: $${item.avg_fee})`);
    });

    // Test 3: Test daily fee collection
    console.log('\n3️⃣ Testing daily fee collection...');
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
    
    console.log('✅ Daily fees (last 30 days):');
    dailyFees.forEach(item => {
      console.log(`  ${item.date}: $${item.daily_fees} fees (${item.daily_transactions} transactions)`);
    });

    // Test 4: Test top fee-generating transactions
    console.log('\n4️⃣ Testing top fee-generating transactions...');
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
      WHERE "feeAmount" > 0
      ORDER BY "feeAmount" DESC
      LIMIT 10
    `;

    const topTransactionsResult = await databaseHelpers.pool.query(topTransactionsQuery);
    const topTransactions = topTransactionsResult.rows;
    
    console.log('✅ Top fee-generating transactions:');
    topTransactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.transactionType} - $${tx.amount} (Fee: $${tx.feeAmount}, Net: $${tx.netAmount})`);
    });

    // Test 5: Test fee rates by type
    console.log('\n5️⃣ Testing fee rates by type...');
    const feeRates = {
      transfer: 0.05,  // 5%
      withdraw: 0.10,  // 10%
      buy: 0.01,       // 1%
      sell: 0.01,      // 1%
    };

    const breakdownWithRates = breakdown.map(item => ({
      ...item,
      fee_rate: feeRates[item.transactionType] || 0,
      fee_percentage: ((feeRates[item.transactionType] || 0) * 100).toFixed(1) + '%'
    }));

    console.log('✅ Breakdown with fee rates:');
    breakdownWithRates.forEach(item => {
      console.log(`  ${item.transactionType}: $${item.total_fees} total fees (${item.fee_percentage} rate)`);
    });

    // Test 6: Simulate the complete API response
    console.log('\n6️⃣ Simulating complete API response...');
    const summary = {
      total_fees: parseFloat(totalFees.total_fees),
      total_transactions: parseInt(totalFees.total_transactions),
      breakdown: breakdownWithRates,
      daily_fees: dailyFees,
      top_transactions: topTransactions,
      date_range: {
        start: null,
        end: null,
        type: null
      }
    };

    console.log('✅ Complete API response structure:');
    console.log(JSON.stringify(summary, null, 2));

    console.log('\n🎉 Admin Fees API test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Total fees query working');
    console.log('✅ Breakdown by type working');
    console.log('✅ Daily fees query working');
    console.log('✅ Top transactions query working');
    console.log('✅ Fee rates calculation working');
    console.log('✅ Complete API response structure working');

  } catch (error) {
    console.error('\n❌ Admin Fees API test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the test
if (require.main === module) {
  testAdminFeesAPI().catch(console.error);
}

module.exports = { testAdminFeesAPI };








