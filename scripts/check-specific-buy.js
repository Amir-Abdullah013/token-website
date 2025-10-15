#!/usr/bin/env node

/**
 * Check Specific Buy Transaction
 * Check the specific buy transaction that was just made
 */

const { databaseHelpers } = require('../src/lib/database');

async function checkSpecificBuy() {
  console.log('🔍 Checking Specific Buy Transaction\n');

  try {
    // Check the most recent buy transaction
    const recentBuy = await databaseHelpers.pool.query(`
      SELECT 
        id, "userId", type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'BUY'
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `);
    
    if (recentBuy.rows.length > 0) {
      const tx = recentBuy.rows[0];
      console.log('Most recent buy transaction:');
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
        console.log('\n🔧 This buy transaction needs fee data. Applying fees...');
        
        const { calculateFee, creditFeeToAdmin } = require('../src/lib/fees');
        const { fee, net } = await calculateFee(tx.amount, "buy");
        
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
        `, [fee, net, 'ADMIN_WALLET', 'buy', tx.id]);
        
        // Credit fee to admin wallet
        if (fee > 0) {
          await creditFeeToAdmin(databaseHelpers.pool, fee);
          console.log(`✅ Fee credited to admin wallet: $${fee.toFixed(2)}`);
        }
        
        console.log('✅ Buy transaction fee data applied successfully!');
      } else {
        console.log('✅ This buy transaction already has fee data');
      }
    } else {
      console.log('❌ No buy transactions found');
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
    console.error('❌ Error checking buy transaction:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the check
if (require.main === module) {
  checkSpecificBuy().catch(console.error);
}

module.exports = { checkSpecificBuy };



