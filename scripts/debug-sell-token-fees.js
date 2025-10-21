#!/usr/bin/env node

/**
 * Debug Sell Token Fees
 * Check why sell token transactions aren't showing in admin fees page
 */

const { databaseHelpers } = require('../src/lib/database');

async function debugSellTokenFees() {
  console.log('🔍 Debugging Sell Token Fees\n');

  try {
    // Check recent sell transactions
    console.log('1️⃣ Checking recent sell transactions...');
    const recentSells = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'SELL'
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log(`Found ${recentSells.rows.length} recent sell transactions:`);
    recentSells.rows.forEach((tx, index) => {
      console.log(`\n${index + 1}. Sell Transaction:`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Fee Amount: ${tx.feeAmount || 'NULL'}`);
      console.log(`   Transaction Type: ${tx.transactionType || 'NULL'}`);
      console.log(`   Net Amount: ${tx.netAmount || 'NULL'}`);
      console.log(`   Fee Receiver: ${tx.feeReceiverId || 'NULL'}`);
      console.log(`   Created: ${tx.createdAt}`);
    });

    // Check if any sell transactions have fee data
    console.log('\n2️⃣ Checking sell transactions with fee data...');
    const sellsWithFees = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'SELL' AND "feeAmount" > 0
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log(`Found ${sellsWithFees.rows.length} sell transactions with fees:`);
    sellsWithFees.rows.forEach((tx, index) => {
      console.log(`\n${index + 1}. Sell with Fee:`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Fee: $${tx.feeAmount}`);
      console.log(`   Net: $${tx.netAmount}`);
      console.log(`   Type: ${tx.transactionType}`);
    });

    // Check the sell API implementation
    console.log('\n3️⃣ Checking sell API implementation...');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
      const sellApiPath = path.join(__dirname, '../src/app/api/Von/sell/route.js');
      const sellApiCode = fs.readFileSync(sellApiPath, 'utf8');
      
      console.log('Sell API analysis:');
      console.log(`  Imports calculateFee: ${sellApiCode.includes('calculateFee') ? '✅' : '❌'}`);
      console.log(`  Imports creditFeeToAdmin: ${sellApiCode.includes('creditFeeToAdmin') ? '✅' : '❌'}`);
      console.log(`  Includes feeAmount: ${sellApiCode.includes('feeAmount') ? '✅' : '❌'}`);
      console.log(`  Includes transactionType: ${sellApiCode.includes('transactionType') ? '✅' : '❌'}`);
      console.log(`  Includes netAmount: ${sellApiCode.includes('netAmount') ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log('❌ Could not read sell API file:', error.message);
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
    console.error('❌ Error debugging sell token fees:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the debug
if (require.main === module) {
  debugSellTokenFees().catch(console.error);
}

module.exports = { debugSellTokenFees };









