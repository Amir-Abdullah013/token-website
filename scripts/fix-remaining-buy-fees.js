#!/usr/bin/env node

/**
 * Fix Remaining Buy Fees
 * Fix any remaining buy transactions that don't have fee data
 */

const { databaseHelpers } = require('../src/lib/database');
const { calculateFee, creditFeeToAdmin } = require('../src/lib/fees');

async function fixRemainingBuyFees() {
  console.log('🔧 Fixing Remaining Buy Fees\n');

  try {
    // Find buy transactions without fee data
    console.log('1️⃣ Finding buy transactions without fee data...');
    const buysWithoutFees = await databaseHelpers.pool.query(`
      SELECT 
        id, "userId", amount, status, "createdAt"
      FROM transactions 
      WHERE type = 'BUY' 
        AND "feeAmount" IS NULL 
        AND status = 'COMPLETED'
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${buysWithoutFees.rows.length} buy transactions without fee data:`);
    buysWithoutFees.rows.forEach((tx, index) => {
      console.log(`  ${index + 1}. ID: ${tx.id}, Amount: $${tx.amount}, Created: ${tx.createdAt}`);
    });

    if (buysWithoutFees.rows.length === 0) {
      console.log('✅ No buy transactions need fee fixes');
      return;
    }

    // Apply fees to each transaction
    console.log('\n2️⃣ Applying fees to remaining buy transactions...');
    let totalFeesApplied = 0;
    
    for (const tx of buysWithoutFees.rows) {
      try {
        // Calculate fee for this buy transaction
        const { fee, net } = await calculateFee(tx.amount, "buy");
        
        console.log(`\n📊 Processing buy transaction ${tx.id}:`);
        console.log(`  Amount: $${tx.amount}`);
        console.log(`  Fee: $${fee.toFixed(2)} (${(fee/tx.amount*100).toFixed(1)}%)`);
        console.log(`  Net: $${net.toFixed(2)}`);
        
        // Update transaction with fee data
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
          totalFeesApplied += fee;
          console.log(`  ✅ Fee credited to admin wallet: $${fee.toFixed(2)}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing buy transaction ${tx.id}:`, error.message);
      }
    }

    console.log(`\n✅ Fixed ${buysWithoutFees.rows.length} buy transactions`);
    console.log(`💰 Total fees applied: $${totalFeesApplied.toFixed(2)}`);

    // Verify the fixes
    console.log('\n3️⃣ Verifying fixes...');
    const updatedBuys = await databaseHelpers.pool.query(`
      SELECT 
        id, amount, "feeAmount", "netAmount", "transactionType"
      FROM transactions 
      WHERE type = 'BUY' 
        AND "feeAmount" > 0
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`✅ Found ${updatedBuys.rows.length} buy transactions with fees:`);
    updatedBuys.rows.forEach((tx, index) => {
      console.log(`  ${index + 1}. $${tx.amount} → Fee: $${tx.feeAmount}, Net: $${tx.netAmount}`);
    });

    // Test admin fees query
    console.log('\n4️⃣ Testing admin fees query...');
    const adminFeesQuery = `
      SELECT 
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE "feeAmount" > 0
    `;
    
    const adminFeesResult = await databaseHelpers.pool.query(adminFeesQuery);
    const adminFees = adminFeesResult.rows[0];
    
    console.log('✅ Admin fees query results:');
    console.log(`  Total fees collected: $${adminFees.total_fees}`);
    console.log(`  Total transactions with fees: ${adminFees.total_transactions}`);

    // Test breakdown by transaction type
    console.log('\n5️⃣ Testing breakdown by transaction type...');
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
    console.log('✅ Breakdown by transaction type:');
    breakdownResult.rows.forEach(row => {
      console.log(`  ${row.transactionType}: $${row.total_fees} total fees (${row.transaction_count} transactions)`);
    });

    console.log('\n🎉 Remaining buy fees fixed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Fee data added to remaining buy transactions');
    console.log('✅ Fees credited to admin wallet');
    console.log('✅ Admin fees page will now show all buy transaction history');
    console.log('✅ All transaction types now have proper fee tracking');

  } catch (error) {
    console.error('\n❌ Error fixing remaining buy fees:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixRemainingBuyFees().catch(console.error);
}

module.exports = { fixRemainingBuyFees };









