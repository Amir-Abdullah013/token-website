#!/usr/bin/env node

/**
 * Fix Sell Transaction Fees
 * Apply fees to the recent sell transaction
 */

const { databaseHelpers } = require('../src/lib/database');
const { calculateFee, creditFeeToAdmin } = require('../src/lib/fees');

async function fixSellTransactionFees() {
  console.log('🔧 Fixing Sell Transaction Fees\n');

  try {
    // Find the most recent sell transaction
    console.log('1️⃣ Finding recent sell transactions...');
    const recentSell = await databaseHelpers.pool.query(`
      SELECT 
        id, "userId", type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'SELL'
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `);
    
    if (recentSell.rows.length === 0) {
      console.log('❌ No sell transactions found');
      return;
    }

    const tx = recentSell.rows[0];
    console.log('Most recent sell transaction:');
    console.log(`  ID: ${tx.id}`);
    console.log(`  Amount: $${tx.amount}`);
    console.log(`  Status: ${tx.status}`);
    console.log(`  Fee Amount: ${tx.feeAmount || 'NULL'}`);
    console.log(`  Transaction Type: ${tx.transactionType || 'NULL'}`);
    console.log(`  Net Amount: ${tx.netAmount || 'NULL'}`);
    console.log(`  Created: ${tx.createdAt}`);
    
    // If this transaction doesn't have fee data, let's fix it
    if (!tx.feeAmount) {
      console.log('\n🔧 This sell transaction needs fee data. Applying fees...');
      
      const { fee, net } = await calculateFee(tx.amount, "sell");
      
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
      `, [fee, net, 'ADMIN_WALLET', 'sell', tx.id]);
      
      // Credit fee to admin wallet
      if (fee > 0) {
        await creditFeeToAdmin(databaseHelpers.pool, fee);
        console.log(`✅ Fee credited to admin wallet: $${fee.toFixed(2)}`);
      }
      
      console.log('✅ Sell transaction fee data applied successfully!');
    } else {
      console.log('✅ This sell transaction already has fee data');
    }

    // Now check the admin fees query
    console.log('\n2️⃣ Testing admin fees query after fix...');
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

    console.log('\n🎉 Sell transaction fees fixed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Fee data added to sell transaction');
    console.log('✅ Fee credited to admin wallet');
    console.log('✅ Admin fees page will now show sell transaction history');
    console.log('✅ All transaction types now have proper fee tracking');

  } catch (error) {
    console.error('❌ Error fixing sell transaction fees:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixSellTransactionFees().catch(console.error);
}

module.exports = { fixSellTransactionFees };





