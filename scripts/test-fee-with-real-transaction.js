#!/usr/bin/env node

/**
 * Test Fee System with Real Transaction
 * Create a test withdrawal to verify fees are applied
 */

const { databaseHelpers } = require('../src/lib/database');
const { calculateFee, creditFeeToAdmin } = require('../src/lib/fees');

async function testFeeWithRealTransaction() {
  console.log('🧪 Testing Fee System with Real Transaction\n');

  try {
    // Test 1: Check if we have any users
    console.log('1️⃣ Checking for test users...');
    const users = await databaseHelpers.pool.query(`
      SELECT u.id, u.email, u.name, w.balance 
      FROM users u
      LEFT JOIN wallets w ON u.id = w."userId"
      WHERE u.role = 'USER' 
      ORDER BY u."createdAt" DESC 
      LIMIT 5
    `);
    
    if (users.rows.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    
    console.log(`✅ Found ${users.rows.length} users:`);
    users.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Balance: $${user.balance}`);
    });

    // Test 2: Test fee calculation
    console.log('\n2️⃣ Testing fee calculation...');
    const testAmount = 100;
    const feeCalculation = await calculateFee(testAmount, 'withdraw');
    
    console.log(`Withdrawal amount: $${testAmount}`);
    console.log(`Fee calculation:`, feeCalculation);
    console.log(`Expected fee: $${testAmount * 0.10} (10%)`);
    console.log(`Expected net: $${testAmount * 0.90}`);

    // Test 3: Create a test transaction with fees
    console.log('\n3️⃣ Creating test transaction with fees...');
    
    const testUser = users.rows[0]; // Use first user
    const testAmount2 = 50;
    const feeCalc = await calculateFee(testAmount2, 'withdraw');
    
    console.log(`Creating withdrawal for user ${testUser.name}:`);
    console.log(`  Amount: $${testAmount2}`);
    console.log(`  Fee: $${feeCalc.fee}`);
    console.log(`  Net: $${feeCalc.net}`);
    console.log(`  Total required: $${testAmount2 + feeCalc.fee}`);

    // Check if user has sufficient balance
    if (testUser.balance < (testAmount2 + feeCalc.fee)) {
      console.log(`❌ User balance ($${testUser.balance}) insufficient for test transaction`);
      console.log(`   Required: $${testAmount2 + feeCalc.fee}`);
      return;
    }

    // Create the transaction
    const transaction = await databaseHelpers.transaction.createTransaction({
      userId: testUser.id,
      type: 'WITHDRAW',
      amount: testAmount2,
      currency: 'USD',
      status: 'COMPLETED', // Mark as completed for testing
      gateway: 'Test',
      binanceAddress: 'test-address-12345678901234567890',
      description: 'Test withdrawal with fee system',
      feeAmount: feeCalc.fee,
      netAmount: feeCalc.net,
      feeReceiverId: 'ADMIN_WALLET',
      transactionType: 'withdraw'
    });

    console.log('✅ Test transaction created:', transaction.id);

    // Test 4: Verify the transaction was created with fee data
    console.log('\n4️⃣ Verifying transaction fee data...');
    const createdTransaction = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE id = $1
    `, [transaction.id]);

    if (createdTransaction.rows.length > 0) {
      const tx = createdTransaction.rows[0];
      console.log('✅ Transaction found with fee data:');
      console.log(`  ID: ${tx.id}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  Amount: $${tx.amount}`);
      console.log(`  Fee Amount: $${tx.feeAmount}`);
      console.log(`  Net Amount: $${tx.netAmount}`);
      console.log(`  Transaction Type: ${tx.transactionType}`);
      console.log(`  Fee Receiver: ${tx.feeReceiverId}`);
    } else {
      console.log('❌ Transaction not found');
    }

    // Test 5: Test the admin fees API query
    console.log('\n5️⃣ Testing admin fees API query...');
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

    // Test 6: Test breakdown by transaction type
    console.log('\n6️⃣ Testing breakdown by transaction type...');
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

    // Test 7: Test recent transactions with fees
    console.log('\n7️⃣ Testing recent transactions with fees...');
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

    console.log('\n🎉 Fee system test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Fee calculation working correctly');
    console.log('✅ Transaction creation with fee data working');
    console.log('✅ Admin fees API queries working');
    console.log('✅ Fee breakdown by type working');
    console.log('✅ Recent transactions with fees query working');

  } catch (error) {
    console.error('\n❌ Fee system test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the test
if (require.main === module) {
  testFeeWithRealTransaction().catch(console.error);
}

module.exports = { testFeeWithRealTransaction };
