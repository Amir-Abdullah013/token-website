#!/usr/bin/env node

/**
 * Check Final Fee Status
 * Check the current status of all transactions and fees
 */

const { databaseHelpers } = require('../src/lib/database');

async function checkFinalFeeStatus() {
  console.log('📊 Checking Final Fee Status\n');

  try {
    // Check all transactions with fees
    console.log('1️⃣ All transactions with fees:');
    const transactionsWithFees = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE "feeAmount" > 0
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${transactionsWithFees.rows.length} transactions with fees:`);
    transactionsWithFees.rows.forEach((tx, index) => {
      console.log(`\n${index + 1}. ${tx.type} Transaction:`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Fee: $${tx.feeAmount}`);
      console.log(`   Net: $${tx.netAmount}`);
      console.log(`   Type: ${tx.transactionType}`);
      console.log(`   Created: ${tx.createdAt}`);
    });

    // Check admin fees query
    console.log('\n2️⃣ Admin fees query results:');
    const adminFeesQuery = `
      SELECT 
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE "feeAmount" > 0
    `;
    
    const adminFeesResult = await databaseHelpers.pool.query(adminFeesQuery);
    const adminFees = adminFeesResult.rows[0];
    
    console.log(`  Total fees collected: $${adminFees.total_fees}`);
    console.log(`  Total transactions with fees: ${adminFees.total_transactions}`);

    // Check breakdown by transaction type
    console.log('\n3️⃣ Breakdown by transaction type:');
    const breakdownQuery = `
      SELECT 
        "transactionType",
        COALESCE(SUM("feeAmount"), 0) as total_fees,
        COUNT(*) as transaction_count,
        COALESCE(AVG("feeAmount"), 0) as avg_fee
      FROM transactions 
      WHERE "feeAmount" > 0
      GROUP BY "transactionType"
      ORDER BY total_fees DESC
    `;
    
    const breakdownResult = await databaseHelpers.pool.query(breakdownQuery);
    breakdownResult.rows.forEach(row => {
      console.log(`  ${row.transactionType}: $${row.total_fees} total fees (${row.transaction_count} transactions, avg: $${row.avg_fee})`);
    });

    // Check all recent transactions (including those without fees)
    console.log('\n4️⃣ All recent transactions (including those without fees):');
    const allRecentTransactions = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      ORDER BY "createdAt" DESC 
      LIMIT 15
    `);
    
    console.log(`Found ${allRecentTransactions.rows.length} recent transactions:`);
    allRecentTransactions.rows.forEach((tx, index) => {
      const hasFees = tx.feeAmount && tx.feeAmount > 0;
      const feeStatus = hasFees ? `✅ Fee: $${tx.feeAmount}` : '❌ No fees';
      console.log(`  ${index + 1}. ${tx.type} - $${tx.amount} (${feeStatus}) - ${tx.createdAt}`);
    });

    // Check if there are any transactions without fees that should have them
    console.log('\n5️⃣ Transactions without fees that should have them:');
    const transactionsWithoutFees = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt"
      FROM transactions 
      WHERE type IN ('BUY', 'SELL', 'WITHDRAW') 
        AND "feeAmount" IS NULL 
        AND status = 'COMPLETED'
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${transactionsWithoutFees.rows.length} transactions without fees:`);
    transactionsWithoutFees.rows.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.type} - $${tx.amount} (${tx.createdAt})`);
    });

    console.log('\n🎉 Fee system status check completed!');
    console.log('\n📋 Summary:');
    console.log(`✅ Transactions with fees: ${transactionsWithFees.rows.length}`);
    console.log(`✅ Total fees collected: $${adminFees.total_fees}`);
    console.log(`✅ Transactions without fees: ${transactionsWithoutFees.rows.length}`);
    console.log(`✅ Fee system is ${transactionsWithoutFees.rows.length === 0 ? 'fully working' : 'partially working'}`);

  } catch (error) {
    console.error('❌ Error checking fee status:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the check
if (require.main === module) {
  checkFinalFeeStatus().catch(console.error);
}

module.exports = { checkFinalFeeStatus };









