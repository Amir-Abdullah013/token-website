const { databaseHelpers } = require('../src/lib/database');

/**
 * Test transaction status updates after deposit/withdrawal approval
 */
async function testTransactionStatusUpdate() {
  console.log('🧪 Testing Transaction Status Updates');
  console.log('=====================================\n');

  try {
    // Find a user with transactions
    console.log('👤 Finding user with transactions...');
    const userResult = await databaseHelpers.pool.query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      INNER JOIN transactions t ON u.id = t."userId"
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('⚠️ No users with transactions found. Creating test data...\n');
      
      // Get any user
      const anyUser = await databaseHelpers.pool.query(`SELECT id, name, email FROM users LIMIT 1`);
      if (anyUser.rows.length === 0) {
        console.error('❌ No users found in database.');
        return;
      }
      
      const testUser = anyUser.rows[0];
      console.log(`✅ Using user: ${testUser.name} (${testUser.email})\n`);
      
      // Create a test PENDING transaction
      console.log('📝 Creating test PENDING transaction...');
      const testTx = await databaseHelpers.transaction.createTransaction({
        userId: testUser.id,
        type: 'DEPOSIT',
        amount: 500.00,
        gateway: 'bank_transfer',
        description: 'Test transaction for status update',
        status: 'PENDING'
      });
      
      console.log(`✅ Test transaction created: ${testTx.id}`);
      console.log(`   Status: ${testTx.status}\n`);
      
      // Update status to COMPLETED
      console.log('✅ Updating transaction status to COMPLETED...');
      const updated = await databaseHelpers.transaction.updateTransactionStatus(testTx.id, 'COMPLETED');
      
      console.log(`✅ Transaction updated: ${updated.id}`);
      console.log(`   Old Status: PENDING`);
      console.log(`   New Status: ${updated.status}\n`);
      
      // Verify the update
      console.log('🔍 Verifying transaction status in database...');
      const verified = await databaseHelpers.transaction.getTransactionById(testTx.id);
      
      if (verified.status === 'COMPLETED') {
        console.log('✅ Status verified: COMPLETED');
        console.log('✅ Transaction status update is working correctly!\n');
      } else {
        console.error(`❌ Status mismatch! Expected: COMPLETED, Got: ${verified.status}\n`);
      }
      
    } else {
      const testUser = userResult.rows[0];
      console.log(`✅ Found user: ${testUser.name} (${testUser.email})\n`);
      
      // Check their transactions
      console.log('📊 Checking transaction statuses...');
      const txResult = await databaseHelpers.pool.query(`
        SELECT id, type, amount, status, gateway, "createdAt", "updatedAt"
        FROM transactions
        WHERE "userId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 10
      `, [testUser.id]);
      
      console.log(`✅ Found ${txResult.rows.length} transactions:\n`);
      
      txResult.rows.forEach((tx, index) => {
        const timeDiff = new Date(tx.updatedAt) - new Date(tx.createdAt);
        const wasUpdated = timeDiff > 1000; // More than 1 second difference
        
        console.log(`${index + 1}. ${tx.type} - $${parseFloat(tx.amount).toFixed(2)}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Gateway: ${tx.gateway || 'N/A'}`);
        console.log(`   Created: ${new Date(tx.createdAt).toLocaleString()}`);
        console.log(`   Updated: ${new Date(tx.updatedAt).toLocaleString()}`);
        console.log(`   ${wasUpdated ? '✅ Was updated after creation' : '⏸️ Never updated'}`);
        console.log('');
      });
    }

    // Check deposit requests
    console.log('📋 Checking deposit requests and their transaction statuses...');
    const depositResult = await databaseHelpers.pool.query(`
      SELECT 
        dr.id as deposit_id,
        dr."userId",
        dr.amount,
        dr.status as deposit_status,
        dr."transactionId",
        t.status as transaction_status,
        t.type as transaction_type
      FROM deposit_requests dr
      LEFT JOIN transactions t ON dr."transactionId" = t.id
      WHERE dr.status IN ('COMPLETED', 'FAILED')
      ORDER BY dr."createdAt" DESC
      LIMIT 5
    `);

    if (depositResult.rows.length > 0) {
      console.log(`✅ Found ${depositResult.rows.length} processed deposits:\n`);
      
      depositResult.rows.forEach((dr, index) => {
        const statusMatch = dr.deposit_status === dr.transaction_status;
        console.log(`${index + 1}. Deposit ID: ${dr.deposit_id}`);
        console.log(`   Amount: $${parseFloat(dr.amount).toFixed(2)}`);
        console.log(`   Deposit Status: ${dr.deposit_status}`);
        console.log(`   Transaction Status: ${dr.transaction_status}`);
        console.log(`   ${statusMatch ? '✅ Statuses match' : '❌ Statuses DO NOT match!'}`);
        console.log('');
      });
      
      const mismatchCount = depositResult.rows.filter(dr => dr.deposit_status !== dr.transaction_status).length;
      if (mismatchCount > 0) {
        console.error(`❌ Found ${mismatchCount} deposits with mismatched transaction statuses!`);
        console.log('🔧 This needs to be fixed!\n');
      } else {
        console.log('✅ All deposit transactions have correct statuses!\n');
      }
    } else {
      console.log('⚠️ No processed deposit requests found.\n');
    }

    console.log('🎉 Transaction Status Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

testTransactionStatusUpdate();




