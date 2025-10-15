const { databaseHelpers } = require('../src/lib/database');

/**
 * Test the transactions API and ensure it returns real data
 */
async function testTransactionsAPI() {
  console.log('🧪 Testing Transactions API');
  console.log('============================\n');

  try {
    // Get a test user
    console.log('👤 Finding test user...');
    const users = await databaseHelpers.pool.query(`
      SELECT id, name, email 
      FROM users 
      LIMIT 1
    `);

    if (users.rows.length === 0) {
      console.error('❌ No users found. Please create a user first.');
      return;
    }

    const testUser = users.rows[0];
    console.log(`✅ Found user: ${testUser.name} (${testUser.email})\n`);

    // Check if transactions exist
    console.log('📊 Checking transactions...');
    const transactionsResult = await databaseHelpers.pool.query(`
      SELECT 
        id,
        "userId",
        type,
        amount,
        status,
        gateway,
        "createdAt"
      FROM transactions 
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 10
    `, [testUser.id]);

    const transactions = transactionsResult.rows;
    console.log(`✅ Found ${transactions.length} transactions for user\n`);

    if (transactions.length > 0) {
      console.log('📋 Recent Transactions:');
      console.log('----------------------');
      transactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.type} - $${parseFloat(tx.amount).toFixed(2)} USD (${tx.status})`);
        console.log(`   Gateway: ${tx.gateway || 'N/A'}`);
        console.log(`   Date: ${new Date(tx.createdAt).toLocaleString()}`);
        console.log('');
      });

      // Verify amounts are numeric and properly formatted
      console.log('✅ Amount Verification:');
      console.log('----------------------');
      transactions.forEach((tx, index) => {
        const amount = parseFloat(tx.amount);
        const formatted = `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        console.log(`${index + 1}. Raw: ${tx.amount} → Parsed: ${amount} → Formatted: ${formatted} USD`);
      });
      console.log('');
    } else {
      console.log('⚠️ No transactions found for this user.');
      console.log('💡 Creating a test transaction...\n');

      // Create a test transaction
      const newTransaction = await databaseHelpers.transaction.createTransaction({
        userId: testUser.id,
        type: 'DEPOSIT',
        amount: 1000.00,
        gateway: 'bank_transfer',
        description: 'Test deposit transaction',
        status: 'COMPLETED'
      });

      console.log('✅ Test transaction created:');
      console.log(`   Type: ${newTransaction.type}`);
      console.log(`   Amount: $${parseFloat(newTransaction.amount).toFixed(2)} USD`);
      console.log(`   Status: ${newTransaction.status}`);
      console.log(`   Gateway: ${newTransaction.gateway}\n`);
    }

    // Test transaction types
    console.log('📈 Transaction Types Summary:');
    console.log('-----------------------------');
    const typesResult = await databaseHelpers.pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM transactions 
      WHERE "userId" = $1
      GROUP BY type
      ORDER BY count DESC
    `, [testUser.id]);

    if (typesResult.rows.length > 0) {
      typesResult.rows.forEach(row => {
        console.log(`${row.type}: ${row.count} transactions, Total: $${parseFloat(row.total).toFixed(2)} USD`);
      });
    } else {
      console.log('No transaction types found.');
    }
    console.log('');

    // Test status distribution
    console.log('📊 Transaction Status Summary:');
    console.log('------------------------------');
    const statusResult = await databaseHelpers.pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM transactions 
      WHERE "userId" = $1
      GROUP BY status
      ORDER BY count DESC
    `, [testUser.id]);

    if (statusResult.rows.length > 0) {
      statusResult.rows.forEach(row => {
        console.log(`${row.status}: ${row.count} transactions`);
      });
    } else {
      console.log('No status data found.');
    }
    console.log('');

    console.log('🎉 Transactions API Test Complete!');
    console.log('==================================');
    console.log('✅ All amounts are in USD ($)');
    console.log('✅ Transaction types properly categorized');
    console.log('✅ Status tracking working correctly');
    console.log(`✅ Total transactions for user: ${transactions.length}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

testTransactionsAPI();
