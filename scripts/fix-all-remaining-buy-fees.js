#!/usr/bin/env node

/**
 * Fix All Remaining Buy Transaction Fees
 * Apply fees to all buy transactions that are missing fee data
 */

const { databaseHelpers } = require('../src/lib/database');
const { calculateFee, creditFeeToAdmin } = require('../src/lib/fees');

async function fixAllRemainingBuyFees() {
  console.log('🔧 Fixing All Remaining Buy Transaction Fees\n');

  try {
    // Find all buy transactions without fees
    console.log('1️⃣ Finding buy transactions without fees...');
    const buysWithoutFees = await databaseHelpers.pool.query(`
      SELECT 
        id, "userId", type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'BUY' 
        AND ("feeAmount" IS NULL OR "feeAmount" = 0)
        AND status = 'COMPLETED'
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${buysWithoutFees.rows.length} buy transactions without fees:`);
    
    if (buysWithoutFees.rows.length === 0) {
      console.log('✅ All buy transactions already have fees!');
      return;
    }

    let totalFeesApplied = 0;
    let transactionsFixed = 0;

    for (const tx of buysWithoutFees.rows) {
      console.log(`\n🔧 Fixing buy transaction: ${tx.id}`);
      console.log(`  Amount: $${tx.amount}`);
      console.log(`  Created: ${tx.createdAt}`);
      
      try {
        const { fee, net } = await calculateFee(tx.amount, "buy");
        
        console.log(`  Fee calculation: $${tx.amount} → Fee: $${fee.toFixed(2)}, Net: $${net.toFixed(2)}`);
        
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
          console.log(`  ✅ Fee credited to admin wallet: $${fee.toFixed(2)}`);
          totalFeesApplied += fee;
        }
        
        transactionsFixed++;
        console.log(`  ✅ Transaction ${tx.id} fixed successfully!`);
        
      } catch (error) {
        console.error(`  ❌ Error fixing transaction ${tx.id}:`, error.message);
      }
    }

    // Verify the fix
    console.log('\n2️⃣ Verifying fix...');
    const remainingBuysWithoutFees = await databaseHelpers.pool.query(`
      SELECT COUNT(*) as count
      FROM transactions 
      WHERE type = 'BUY' 
        AND ("feeAmount" IS NULL OR "feeAmount" = 0)
        AND status = 'COMPLETED'
    `);
    
    console.log(`Remaining buy transactions without fees: ${remainingBuysWithoutFees.rows[0].count}`);

    // Check admin fees query
    console.log('\n3️⃣ Testing admin fees query after fix...');
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

    console.log('\n🎉 All remaining buy transaction fees fixed!');
    console.log('\n📋 Summary:');
    console.log(`✅ Transactions fixed: ${transactionsFixed}`);
    console.log(`✅ Total fees applied: $${totalFeesApplied.toFixed(2)}`);
    console.log(`✅ Remaining buy transactions without fees: ${remainingBuysWithoutFees.rows[0].count}`);
    console.log(`✅ Total fees collected: $${adminFees.total_fees}`);
    console.log('✅ All buy transactions now have proper fee tracking!');

  } catch (error) {
    console.error('❌ Error fixing buy transaction fees:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixAllRemainingBuyFees().catch(console.error);
}

module.exports = { fixAllRemainingBuyFees };









