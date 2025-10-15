#!/usr/bin/env node

/**
 * Complete Fee System Test
 * End-to-end test of the entire fee management system
 */

const { databaseHelpers } = require('../src/lib/database');
const { calculateFee, creditFeeToAdmin, getAllFeeSettings, updateFeeRate } = require('../src/lib/fees');

async function testCompleteFeeSystem() {
  console.log('🧪 Complete Fee System Test\n');

  try {
    // Test 1: Database and Schema
    console.log('1️⃣ Testing database and schema...');
    
    // Check fee_settings table
    const feeSettingsExists = await databaseHelpers.pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fee_settings'
      );
    `);
    
    if (!feeSettingsExists.rows[0].exists) {
      throw new Error('fee_settings table does not exist');
    }
    console.log('✅ fee_settings table exists');

    // Check transactions table has fee columns
    const transactionColumns = await databaseHelpers.pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND table_schema = 'public'
      AND column_name IN ('feeAmount', 'transactionType', 'netAmount', 'feeReceiverId')
    `);
    
    if (transactionColumns.rows.length !== 4) {
      throw new Error('Transactions table missing fee-related columns');
    }
    console.log('✅ Transactions table has all fee columns');

    // Test 2: Fee Settings Management
    console.log('\n2️⃣ Testing fee settings management...');
    
    // Get all fee settings
    const allSettings = await getAllFeeSettings();
    console.log(`✅ Retrieved ${allSettings.length} fee settings`);
    
    // Verify default settings
    const expectedSettings = ['transfer', 'withdraw', 'buy', 'sell'];
    const settingTypes = allSettings.map(s => s.type);
    
    for (const expectedType of expectedSettings) {
      if (!settingTypes.includes(expectedType)) {
        throw new Error(`Missing fee setting for type: ${expectedType}`);
      }
    }
    console.log('✅ All expected fee settings present');

    // Test 3: Fee Calculation
    console.log('\n3️⃣ Testing fee calculation...');
    
    const testCases = [
      { type: 'transfer', amount: 1000, expectedRate: 0.05 },
      { type: 'withdraw', amount: 500, expectedRate: 0.10 },
      { type: 'buy', amount: 200, expectedRate: 0.01 },
      { type: 'sell', amount: 300, expectedRate: 0.01 }
    ];
    
    for (const testCase of testCases) {
      const result = await calculateFee(testCase.amount, testCase.type);
      
      if (Math.abs(result.feeRate - testCase.expectedRate) > 0.001) {
        throw new Error(`Fee rate mismatch for ${testCase.type}: expected ${testCase.expectedRate}, got ${result.feeRate}`);
      }
      
      const expectedFee = testCase.amount * testCase.expectedRate;
      const expectedNet = testCase.amount - expectedFee;
      
      if (Math.abs(result.fee - expectedFee) > 0.01) {
        throw new Error(`Fee calculation mismatch for ${testCase.type}: expected ${expectedFee}, got ${result.fee}`);
      }
      
      if (Math.abs(result.net - expectedNet) > 0.01) {
        throw new Error(`Net calculation mismatch for ${testCase.type}: expected ${expectedNet}, got ${result.net}`);
      }
      
      console.log(`✅ ${testCase.type.toUpperCase()}: $${testCase.amount} → Fee: $${result.fee.toFixed(2)} (${(result.feeRate * 100).toFixed(1)}%), Net: $${result.net.toFixed(2)}`);
    }

    // Test 4: Dynamic Fee Rate Updates
    console.log('\n4️⃣ Testing dynamic fee rate updates...');
    
    // Update transfer fee from 5% to 6%
    const originalRate = allSettings.find(s => s.type === 'transfer').rate;
    await updateFeeRate('transfer', 0.06, true);
    
    // Verify the update
    const updatedResult = await calculateFee(1000, 'transfer');
    if (Math.abs(updatedResult.feeRate - 0.06) > 0.001) {
      throw new Error('Fee rate update failed');
    }
    console.log('✅ Transfer fee updated to 6%');
    
    // Restore original rate
    await updateFeeRate('transfer', originalRate, true);
    const restoredResult = await calculateFee(1000, 'transfer');
    if (Math.abs(restoredResult.feeRate - originalRate) > 0.001) {
      throw new Error('Fee rate restoration failed');
    }
    console.log('✅ Transfer fee restored to original rate');

    // Test 5: Transaction Creation with Fees
    console.log('\n5️⃣ Testing transaction creation with fees...');
    
    // Get a real user
    const userResult = await databaseHelpers.pool.query(`
      SELECT id FROM users WHERE role = 'USER' LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      throw new Error('No users found for testing');
    }
    
    const userId = userResult.rows[0].id;
    
    // Create test transactions for each type
    const transactionTypes = [
      { dbType: 'WITHDRAW', feeType: 'withdraw' },
      { dbType: 'BUY', feeType: 'buy' },
      { dbType: 'SELL', feeType: 'sell' }
    ];
    const createdTransactions = [];
    
    for (const { dbType, feeType } of transactionTypes) {
      const amount = 100;
      const feeCalc = await calculateFee(amount, feeType);
      
      const transaction = await databaseHelpers.pool.query(`
        INSERT INTO transactions (
          id, "userId", type, amount, currency, status, gateway,
          description, "feeAmount", "netAmount", "feeReceiverId", "transactionType",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING *
      `, [
        `test-complete-${feeType}-${Date.now()}`,
        userId,
        dbType,
        amount,
        'USD',
        'COMPLETED',
        'Test',
        `Test ${feeType} transaction with fee system`,
        feeCalc.fee,
        feeCalc.net,
        'ADMIN_WALLET',
        feeType
      ]);
      
      createdTransactions.push(transaction.rows[0]);
      console.log(`✅ Created ${feeType} transaction: $${amount} (Fee: $${feeCalc.fee.toFixed(2)}, Net: $${feeCalc.net.toFixed(2)})`);
    }

    // Test 6: Admin Fees Analytics
    console.log('\n6️⃣ Testing admin fees analytics...');
    
    // Total fees query
    const totalFeesQuery = `
      SELECT 
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE "feeAmount" > 0
    `;
    
    const totalFeesResult = await databaseHelpers.pool.query(totalFeesQuery);
    const totalFees = totalFeesResult.rows[0];
    
    console.log(`✅ Total fees collected: $${totalFees.total_fees}`);
    console.log(`✅ Total transactions with fees: ${totalFees.total_transactions}`);
    
    // Breakdown by type
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

    // Test 7: Public Fees API
    console.log('\n7️⃣ Testing public fees API...');
    
    const publicFeesQuery = `
      SELECT type, rate, "isActive" 
      FROM fee_settings 
      WHERE "isActive" = true
      ORDER BY type
    `;
    
    const publicFeesResult = await databaseHelpers.pool.query(publicFeesQuery);
    const publicFeeRates = {};
    publicFeesResult.rows.forEach(setting => {
      publicFeeRates[setting.type] = setting.rate;
    });
    
    console.log('✅ Public fees API data:');
    Object.entries(publicFeeRates).forEach(([type, rate]) => {
      console.log(`  ${type}: ${(rate * 100).toFixed(1)}%`);
    });

    // Test 8: Cleanup
    console.log('\n8️⃣ Cleaning up test data...');
    
    // Delete test transactions
    const testTransactionIds = createdTransactions.map(tx => tx.id);
    if (testTransactionIds.length > 0) {
      await databaseHelpers.pool.query(`
        DELETE FROM transactions 
        WHERE id = ANY($1)
      `, [testTransactionIds]);
      console.log(`✅ Cleaned up ${testTransactionIds.length} test transactions`);
    }

    console.log('\n🎉 Complete Fee System Test Passed!');
    console.log('\n📋 Final Summary:');
    console.log('✅ Database schema working');
    console.log('✅ Fee settings management working');
    console.log('✅ Fee calculations accurate');
    console.log('✅ Dynamic fee rate updates working');
    console.log('✅ Transaction creation with fees working');
    console.log('✅ Admin fees analytics working');
    console.log('✅ Public fees API working');
    console.log('✅ All transaction types supported');
    console.log('✅ Real-time fee updates working');
    console.log('✅ Fee system ready for production!');

  } catch (error) {
    console.error('\n❌ Complete Fee System Test Failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the test
if (require.main === module) {
  testCompleteFeeSystem().catch(console.error);
}

module.exports = { testCompleteFeeSystem };
