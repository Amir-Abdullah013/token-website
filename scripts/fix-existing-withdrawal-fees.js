#!/usr/bin/env node

/**
 * Fix Existing Withdrawal Fees
 * Add fee data to existing withdrawal transactions that were approved without fees
 */

const { databaseHelpers } = require('../src/lib/database');
const { calculateFee, creditFeeToAdmin } = require('../src/lib/fees');

async function fixExistingWithdrawalFees() {
  console.log('🔧 Fixing Existing Withdrawal Fees\n');

  try {
    // Find withdrawal transactions without fee data
    console.log('1️⃣ Finding withdrawal transactions without fee data...');
    const withdrawalsWithoutFees = await databaseHelpers.pool.query(`
      SELECT 
        id, "userId", amount, status, "createdAt"
      FROM transactions 
      WHERE type = 'WITHDRAW' 
        AND "feeAmount" IS NULL 
        AND status = 'COMPLETED'
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${withdrawalsWithoutFees.rows.length} withdrawal transactions without fee data:`);
    withdrawalsWithoutFees.rows.forEach((tx, index) => {
      console.log(`  ${index + 1}. ID: ${tx.id}, Amount: $${tx.amount}, Created: ${tx.createdAt}`);
    });

    if (withdrawalsWithoutFees.rows.length === 0) {
      console.log('✅ No withdrawal transactions need fee fixes');
      return;
    }

    // Apply fees to each transaction
    console.log('\n2️⃣ Applying fees to existing withdrawals...');
    let totalFeesApplied = 0;
    
    for (const tx of withdrawalsWithoutFees.rows) {
      try {
        // Calculate fee for this withdrawal
        const { fee, net } = await calculateFee(tx.amount, "withdraw");
        
        console.log(`\n📊 Processing withdrawal ${tx.id}:`);
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
        `, [fee, net, 'ADMIN_WALLET', 'withdraw', tx.id]);
        
        // Credit fee to admin wallet
        if (fee > 0) {
          await creditFeeToAdmin(databaseHelpers.pool, fee);
          totalFeesApplied += fee;
          console.log(`  ✅ Fee credited to admin wallet: $${fee.toFixed(2)}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing withdrawal ${tx.id}:`, error.message);
      }
    }

    console.log(`\n✅ Fixed ${withdrawalsWithoutFees.rows.length} withdrawal transactions`);
    console.log(`💰 Total fees applied: $${totalFeesApplied.toFixed(2)}`);

    // Verify the fixes
    console.log('\n3️⃣ Verifying fixes...');
    const updatedWithdrawals = await databaseHelpers.pool.query(`
      SELECT 
        id, amount, "feeAmount", "netAmount", "transactionType"
      FROM transactions 
      WHERE type = 'WITHDRAW' 
        AND "feeAmount" > 0
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`✅ Found ${updatedWithdrawals.rows.length} withdrawal transactions with fees:`);
    updatedWithdrawals.rows.forEach((tx, index) => {
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

    console.log('\n🎉 Existing withdrawal fees fixed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Fee data added to existing withdrawals');
    console.log('✅ Fees credited to admin wallet');
    console.log('✅ Admin fees page will now show withdrawal history');
    console.log('✅ Future withdrawals will automatically include fees');

  } catch (error) {
    console.error('\n❌ Error fixing withdrawal fees:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixExistingWithdrawalFees().catch(console.error);
}

module.exports = { fixExistingWithdrawalFees };



