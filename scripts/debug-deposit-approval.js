const { databaseHelpers } = require('../src/lib/database');

/**
 * Debug deposit approval process to see why transactions remain PENDING
 */
async function debugDepositApproval() {
  console.log('🔍 Debugging Deposit Approval Process');
  console.log('=====================================\n');

  try {
    // Find a PENDING deposit request
    console.log('📋 Finding PENDING deposit requests...');
    const pendingDeposits = await databaseHelpers.pool.query(`
      SELECT 
        dr.id,
        dr."userId",
        dr.amount,
        dr.status,
        dr."createdAt",
        u.name,
        u.email
      FROM deposit_requests dr
      LEFT JOIN users u ON dr."userId" = u.id
      WHERE dr.status = 'PENDING'
      ORDER BY dr."createdAt" DESC
      LIMIT 5
    `);

    if (pendingDeposits.rows.length === 0) {
      console.log('⚠️ No PENDING deposits found. Creating test data...\n');
      
      // Get a user
      const user = await databaseHelpers.pool.query(`SELECT id, name, email FROM users LIMIT 1`);
      if (user.rows.length === 0) {
        console.error('❌ No users found');
        return;
      }
      
      const testUser = user.rows[0];
      console.log(`✅ Using user: ${testUser.name} (${testUser.email})\n`);
      
      // Create a test deposit request
      const depositRequest = await databaseHelpers.deposit.createDepositRequest({
        userId: testUser.id,
        amount: 500.00,
        screenshot: '/uploads/test.jpg',
        binanceAddress: 'test-address'
      });
      
      console.log(`✅ Created test deposit request: ${depositRequest.id}`);
      console.log(`   Amount: $${depositRequest.amount}`);
      console.log(`   Status: ${depositRequest.status}\n`);
      
      // Create corresponding transaction
      const transaction = await databaseHelpers.transaction.createTransaction({
        userId: testUser.id,
        type: 'DEPOSIT',
        amount: 500.00,
        currency: 'USD',
        status: 'PENDING',
        gateway: 'Binance',
        description: 'Test deposit transaction'
      });
      
      console.log(`✅ Created test transaction: ${transaction.id}`);
      console.log(`   Status: ${transaction.status}\n`);
      
      // Now test the approval process
      console.log('🔄 Testing deposit approval process...');
      
      // Simulate the approval query
      const approvalQuery = `
        UPDATE transactions
        SET status = $1, "updatedAt" = NOW()
        WHERE "userId" = $2 
          AND type = 'DEPOSIT'
          AND amount = $3
          AND status = 'PENDING'
          AND "createdAt" >= $4 - INTERVAL '1 day'
          AND "createdAt" <= $4 + INTERVAL '1 day'
        RETURNING id, status
      `;
      
      const approvalResult = await databaseHelpers.pool.query(approvalQuery, [
        'COMPLETED',
        depositRequest.userId,
        depositRequest.amount,
        depositRequest.createdAt
      ]);
      
      console.log('📊 Approval Query Result:');
      console.log(`   Rows affected: ${approvalResult.rows.length}`);
      if (approvalResult.rows.length > 0) {
        console.log(`   Updated transaction: ${approvalResult.rows[0].id}`);
        console.log(`   New status: ${approvalResult.rows[0].status}`);
      } else {
        console.log('❌ No transactions were updated!');
        
        // Debug: Check what transactions exist
        console.log('\n🔍 Debugging - Checking existing transactions...');
        const existingTxs = await databaseHelpers.pool.query(`
          SELECT 
            id,
            "userId",
            type,
            amount,
            status,
            "createdAt"
          FROM transactions
          WHERE "userId" = $1
          ORDER BY "createdAt" DESC
        `, [depositRequest.userId]);
        
        console.log(`Found ${existingTxs.rows.length} transactions for user:`);
        existingTxs.rows.forEach((tx, i) => {
          console.log(`  ${i+1}. ${tx.id} - ${tx.type} - $${tx.amount} - ${tx.status} - ${new Date(tx.createdAt).toISOString()}`);
        });
        
        // Check date comparison
        console.log('\n📅 Date comparison:');
        console.log(`Deposit created: ${depositRequest.createdAt}`);
        console.log(`Transaction created: ${transaction.createdAt}`);
        const depositDate = new Date(depositRequest.createdAt);
        const txDate = new Date(transaction.createdAt);
        const timeDiff = Math.abs(depositDate - txDate);
        console.log(`Time difference: ${timeDiff}ms (${timeDiff/1000}s)`);
        console.log(`Within 1 day: ${timeDiff < 24*60*60*1000}`);
      }
      
    } else {
      console.log(`✅ Found ${pendingDeposits.rows.length} PENDING deposits:\n`);
      
      pendingDeposits.rows.forEach((deposit, index) => {
        console.log(`${index + 1}. Deposit ID: ${deposit.id}`);
        console.log(`   User: ${deposit.name} (${deposit.email})`);
        console.log(`   Amount: $${deposit.amount}`);
        console.log(`   Status: ${deposit.status}`);
        console.log(`   Created: ${new Date(deposit.createdAt).toLocaleString()}\n`);
      });
      
      // Check corresponding transactions
      console.log('🔍 Checking corresponding transactions...');
      for (const deposit of pendingDeposits.rows) {
        const transactions = await databaseHelpers.pool.query(`
          SELECT 
            id,
            type,
            amount,
            status,
            "createdAt"
          FROM transactions
          WHERE "userId" = $1
            AND type = 'DEPOSIT'
            AND amount = $2
          ORDER BY "createdAt" DESC
        `, [deposit.userId, deposit.amount]);
        
        console.log(`\nDeposit ${deposit.id} ($${deposit.amount}):`);
        if (transactions.rows.length > 0) {
          transactions.rows.forEach((tx, i) => {
            console.log(`  Transaction ${i+1}: ${tx.id} - ${tx.status} - ${new Date(tx.createdAt).toLocaleString()}`);
          });
        } else {
          console.log('  ❌ No matching transactions found!');
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Stack:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

debugDepositApproval();



