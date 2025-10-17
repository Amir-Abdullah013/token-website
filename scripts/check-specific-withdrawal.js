#!/usr/bin/env node

/**
 * Check Specific Withdrawal
 * Check the specific withdrawal transaction that was mentioned
 */

const { databaseHelpers } = require('../src/lib/database');

async function checkSpecificWithdrawal() {
  console.log('🔍 Checking Specific Withdrawal\n');

  try {
    // Check the most recent withdrawal (the one that was just approved)
    const recentWithdrawal = await databaseHelpers.pool.query(`
      SELECT 
        id, "userId", type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'WITHDRAW'
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `);
    
    if (recentWithdrawal.rows.length > 0) {
      const tx = recentWithdrawal.rows[0];
      console.log('Most recent withdrawal:');
      console.log(`  ID: ${tx.id}`);
      console.log(`  Amount: $${tx.amount}`);
      console.log(`  Status: ${tx.status}`);
      console.log(`  Fee Amount: ${tx.feeAmount || 'NULL'}`);
      console.log(`  Transaction Type: ${tx.transactionType || 'NULL'}`);
      console.log(`  Net Amount: ${tx.netAmount || 'NULL'}`);
      console.log(`  Fee Receiver: ${tx.feeReceiverId || 'NULL'}`);
      console.log(`  Created: ${tx.createdAt}`);
      
      // If this transaction doesn't have fee data, let's fix it
      if (!tx.feeAmount) {
        console.log('\n🔧 This withdrawal needs fee data. Applying fees...');
        
        const { calculateFee, creditFeeToAdmin } = require('../src/lib/fees');
        const { fee, net } = await calculateFee(tx.amount, "withdraw");
        
        console.log(`Fee calculation: $${tx.amount} → Fee: $${fee.toFixed(2)}, Net: $${net.toFixed(2)}`);
        
        // Update the transaction
        await databaseHelpers.pool.query(`
          UPDATE transactions 
          SET 
            "feeAmount" = $1,
            "netAmount" = $2,
            "feeReceiverId" = $3,
            "transactionType" = $4,
            "updatedAt" = NOW()
          WHERE id = $5
        `, [fee, net, 'ADMIN_WALLET', 'withdraw', tx.id]);
        
        // Credit fee to admin wallet
        if (fee > 0) {
          await creditFeeToAdmin(databaseHelpers.pool, fee);
          console.log(`✅ Fee credited to admin wallet: $${fee.toFixed(2)}`);
        }
        
        console.log('✅ Withdrawal fee data applied successfully!');
      } else {
        console.log('✅ This withdrawal already has fee data');
      }
    } else {
      console.log('❌ No withdrawal transactions found');
    }

    // Now check the admin fees query
    console.log('\n📊 Testing admin fees query after fix...');
    const adminFeesQuery = `
      SELECT 
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE "feeAmount" > 0
    `;
    
    const adminFeesResult = await databaseHelpers.pool.query(adminFeesQuery);
    const adminFees = adminFeesResult.rows[0];
    
    console.log('Admin fees query results:');
    console.log(`  Total fees collected: $${adminFees.total_fees}`);
    console.log(`  Total transactions with fees: ${adminFees.total_transactions}`);

    // Check breakdown by transaction type
    const breakdownQuery = `
      SELECT 
        "transactionType",
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE "feeAmount" > 0
      GROUP BY "transactionType"
      ORDER BY total_fees DESC
    `;
    
    const breakdownResult = await databaseHelpers.pool.query(breakdownQuery);
    console.log('\nBreakdown by transaction type:');
    breakdownResult.rows.forEach(row => {
      console.log(`  ${row.transactionType}: $${row.total_fees} total fees (${row.transaction_count} transactions)`);
    });

  } catch (error) {
    console.error('❌ Error checking withdrawal:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the check
if (require.main === module) {
  checkSpecificWithdrawal().catch(console.error);
}

module.exports = { checkSpecificWithdrawal };







