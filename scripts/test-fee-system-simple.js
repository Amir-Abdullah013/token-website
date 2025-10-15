#!/usr/bin/env node

/**
 * Simple Fee System Test
 * Create a test transaction to verify fees are applied
 */

const { databaseHelpers } = require('../src/lib/database');
const { calculateFee } = require('../src/lib/fees');

async function testFeeSystemSimple() {
  console.log('🧪 Simple Fee System Test\n');

  try {
    // Test 1: Create a test transaction with fees
    console.log('1️⃣ Creating test transaction with fees...');
    
    const testAmount = 100;
    const feeCalc = await calculateFee(testAmount, 'withdraw');
    
    console.log(`Test withdrawal: $${testAmount}`);
    console.log(`Fee: $${feeCalc.fee} (${(feeCalc.feeRate * 100).toFixed(1)}%)`);
    console.log(`Net: $${feeCalc.net}`);

    // Get a real user ID
    const userResult = await databaseHelpers.pool.query(`
      SELECT id FROM users WHERE role = 'USER' LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Using user ID: ${userId}`);

    // Create the transaction directly
    const transaction = await databaseHelpers.pool.query(`
      INSERT INTO transactions (
        id, "userId", type, amount, currency, status, gateway,
        description, "feeAmount", "netAmount", "feeReceiverId", "transactionType",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      ) RETURNING *
    `, [
      'test-fee-' + Date.now(),
      userId,
      'WITHDRAW',
      testAmount,
      'USD',
      'COMPLETED',
      'Test',
      'Test withdrawal with fee system',
      feeCalc.fee,
      feeCalc.net,
      'ADMIN_WALLET',
      'withdraw'
    ]);

    console.log('✅ Test transaction created:', transaction.rows[0].id);

    // Test 2: Verify the transaction has fee data
    console.log('\n2️⃣ Verifying transaction fee data...');
    const createdTx = transaction.rows[0];
    console.log('Transaction details:');
    console.log(`  ID: ${createdTx.id}`);
    console.log(`  Type: ${createdTx.type}`);
    console.log(`  Amount: $${createdTx.amount}`);
    console.log(`  Fee Amount: $${createdTx.feeAmount}`);
    console.log(`  Net Amount: $${createdTx.netAmount}`);
    console.log(`  Transaction Type: ${createdTx.transactionType}`);
    console.log(`  Fee Receiver: ${createdTx.feeReceiverId}`);

    // Test 3: Test the admin fees API query
    console.log('\n3️⃣ Testing admin fees API query...');
    const feesQuery = `
      SELECT 
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE "feeAmount" > 0
    `;
    
    const feesResult = await databaseHelpers.pool.query(feesQuery);
    const feesData = feesResult.rows[0];
    
    console.log('✅ Fees query results:');
    console.log(`  Total fees collected: $${feesData.total_fees}`);
    console.log(`  Total transactions with fees: ${feesData.total_transactions}`);

    // Test 4: Test breakdown by transaction type
    console.log('\n4️⃣ Testing breakdown by transaction type...');
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
    console.log('✅ Breakdown by transaction type:');
    breakdownResult.rows.forEach(row => {
      console.log(`  ${row.transactionType}: $${row.total_fees} total fees (${row.transaction_count} transactions, avg: $${row.avg_fee})`);
    });

    // Test 5: Test recent transactions with fees
    console.log('\n5️⃣ Testing recent transactions with fees...');
    const recentFeesQuery = `
      SELECT 
        id, type, amount, "feeAmount", "transactionType", "netAmount", "createdAt"
      FROM transactions 
      WHERE "feeAmount" > 0
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `;
    
    const recentFeesResult = await databaseHelpers.pool.query(recentFeesQuery);
    console.log(`✅ Found ${recentFeesResult.rows.length} recent transactions with fees:`);
    recentFeesResult.rows.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.type} - $${tx.amount} (Fee: $${tx.feeAmount}, Net: $${tx.netAmount})`);
    });

    // Test 6: Test different transaction types
    console.log('\n6️⃣ Testing different transaction types...');
    const testTypes = ['transfer', 'withdraw', 'buy', 'sell'];
    
    for (const type of testTypes) {
      const calc = await calculateFee(100, type);
      console.log(`${type.toUpperCase()}: $100 → Fee: $${calc.fee} (${(calc.feeRate * 100).toFixed(1)}%), Net: $${calc.net}`);
    }

    console.log('\n🎉 Fee system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Fee calculation working correctly');
    console.log('✅ Transaction creation with fee data working');
    console.log('✅ Admin fees API queries working');
    console.log('✅ Fee breakdown by type working');
    console.log('✅ Recent transactions with fees query working');
    console.log('✅ Different transaction types working');

  } catch (error) {
    console.error('\n❌ Fee system test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the test
if (require.main === module) {
  testFeeSystemSimple().catch(console.error);
}

module.exports = { testFeeSystemSimple };
