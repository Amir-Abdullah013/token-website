#!/usr/bin/env node

/**
 * Debug New Buy Transaction
 * Check why the latest buy transaction isn't showing in admin fees page
 */

const { databaseHelpers } = require('../src/lib/database');

async function debugNewBuyTransaction() {
  console.log('🔍 Debugging New Buy Transaction\n');

  try {
    // Check the most recent buy transaction
    console.log('1️⃣ Checking most recent buy transaction...');
    const recentBuy = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
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
      
      // Check if this transaction has fee data
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

    // Check all recent transactions
    console.log('\n2️⃣ All recent transactions:');
    const allRecentTransactions = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${allRecentTransactions.rows.length} recent transactions:`);
    allRecentTransactions.rows.forEach((tx, index) => {
      const hasFees = tx.feeAmount && tx.feeAmount > 0;
      const feeStatus = hasFees ? `✅ Fee: $${tx.feeAmount}` : '❌ No fees';
      console.log(`  ${index + 1}. ${tx.type} - $${tx.amount} (${feeStatus}) - ${tx.createdAt}`);
    });

    // Check admin fees query
    console.log('\n3️⃣ Testing admin fees query...');
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
    console.log('\n4️⃣ Breakdown by transaction type:');
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
    breakdownResult.rows.forEach(row => {
      console.log(`  ${row.transactionType}: $${row.total_fees} total fees (${row.transaction_count} transactions)`);
    });

    // Check if there are any buy transactions without fees
    console.log('\n5️⃣ Buy transactions without fees:');
    const buysWithoutFees = await databaseHelpers.pool.query(`
      SELECT 
        id, amount, "createdAt"
      FROM transactions 
      WHERE type = 'BUY' 
        AND "feeAmount" IS NULL 
        AND status = 'COMPLETED'
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${buysWithoutFees.rows.length} buy transactions without fees:`);
    buysWithoutFees.rows.forEach((tx, index) => {
      console.log(`  ${index + 1}. ID: ${tx.id}, Amount: $${tx.amount}, Created: ${tx.createdAt}`);
    });

    console.log('\n🎉 Buy transaction debug completed!');
    console.log('\n📋 Summary:');
    console.log(`✅ Total fees collected: $${adminFees.total_fees}`);
    console.log(`✅ Transactions with fees: ${adminFees.total_transactions}`);
    console.log(`✅ Buy transactions without fees: ${buysWithoutFees.rows.length}`);

  } catch (error) {
    console.error('❌ Error debugging buy transaction:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the debug
if (require.main === module) {
  debugNewBuyTransaction().catch(console.error);
}

module.exports = { debugNewBuyTransaction };






