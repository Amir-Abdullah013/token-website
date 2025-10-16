#!/usr/bin/env node

/**
 * Debug Buy Token Fees
 * Check why buy token transactions aren't showing in admin fees page
 */

const { databaseHelpers } = require('../src/lib/database');

async function debugBuyTokenFees() {
  console.log('🔍 Debugging Buy Token Fees\n');

  try {
    // Check recent buy transactions
    console.log('1️⃣ Checking recent buy transactions...');
    const recentBuys = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'BUY'
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log(`Found ${recentBuys.rows.length} recent buy transactions:`);
    recentBuys.rows.forEach((tx, index) => {
      console.log(`\n${index + 1}. Buy Transaction:`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Fee Amount: ${tx.feeAmount || 'NULL'}`);
      console.log(`   Transaction Type: ${tx.transactionType || 'NULL'}`);
      console.log(`   Net Amount: ${tx.netAmount || 'NULL'}`);
      console.log(`   Fee Receiver: ${tx.feeReceiverId || 'NULL'}`);
      console.log(`   Created: ${tx.createdAt}`);
    });

    // Check if any buy transactions have fee data
    console.log('\n2️⃣ Checking buy transactions with fee data...');
    const buysWithFees = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'BUY' AND "feeAmount" > 0
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log(`Found ${buysWithFees.rows.length} buy transactions with fees:`);
    buysWithFees.rows.forEach((tx, index) => {
      console.log(`\n${index + 1}. Buy with Fee:`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Fee: $${tx.feeAmount}`);
      console.log(`   Net: $${tx.netAmount}`);
      console.log(`   Type: ${tx.transactionType}`);
    });

    // Check the buy API implementation
    console.log('\n3️⃣ Checking buy API implementation...');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
      const buyApiPath = path.join(__dirname, '../src/app/api/tiki/buy/route.js');
      const buyApiCode = fs.readFileSync(buyApiPath, 'utf8');
      
      console.log('Buy API analysis:');
      console.log(`  Imports calculateFee: ${buyApiCode.includes('calculateFee') ? '✅' : '❌'}`);
      console.log(`  Imports creditFeeToAdmin: ${buyApiCode.includes('creditFeeToAdmin') ? '✅' : '❌'}`);
      console.log(`  Includes feeAmount: ${buyApiCode.includes('feeAmount') ? '✅' : '❌'}`);
      console.log(`  Includes transactionType: ${buyApiCode.includes('transactionType') ? '✅' : '❌'}`);
      console.log(`  Includes netAmount: ${buyApiCode.includes('netAmount') ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log('❌ Could not read buy API file:', error.message);
    }

    // Check admin fees query
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
    
    console.log('Admin fees query results:');
    console.log(`  Total fees: $${adminFees.total_fees}`);
    console.log(`  Total transactions with fees: ${adminFees.total_transactions}`);

    // Check breakdown by transaction type
    console.log('\n5️⃣ Checking breakdown by transaction type...');
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
    console.log('Breakdown by transaction type:');
    breakdownResult.rows.forEach(row => {
      console.log(`  ${row.transactionType}: $${row.total_fees} total fees (${row.transaction_count} transactions)`);
    });

    // Check all recent transactions
    console.log('\n6️⃣ Checking all recent transactions...');
    const allRecentTransactions = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `);
    
    console.log('All recent transactions:');
    allRecentTransactions.rows.forEach((tx, index) => {
      console.log(`\n${index + 1}. ${tx.type} Transaction:`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Fee Amount: ${tx.feeAmount || 'NULL'}`);
      console.log(`   Transaction Type: ${tx.transactionType || 'NULL'}`);
      console.log(`   Created: ${tx.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error debugging buy token fees:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the debug
if (require.main === module) {
  debugBuyTokenFees().catch(console.error);
}

module.exports = { debugBuyTokenFees };





