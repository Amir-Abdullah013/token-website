#!/usr/bin/env node

/**
 * Debug Recent Withdrawal
 * Check why withdrawal isn't showing in admin fees page
 */

const { databaseHelpers } = require('../src/lib/database');

async function debugRecentWithdrawal() {
  console.log('🔍 Debugging Recent Withdrawal\n');

  try {
    // Check the most recent withdrawal transactions
    console.log('1️⃣ Checking recent withdrawal transactions...');
    const recentWithdrawals = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'WITHDRAW'
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log(`Found ${recentWithdrawals.rows.length} recent withdrawals:`);
    recentWithdrawals.rows.forEach((tx, index) => {
      console.log(`\n${index + 1}. Withdrawal Transaction:`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Fee Amount: ${tx.feeAmount || 'NULL'}`);
      console.log(`   Transaction Type: ${tx.transactionType || 'NULL'}`);
      console.log(`   Net Amount: ${tx.netAmount || 'NULL'}`);
      console.log(`   Fee Receiver: ${tx.feeReceiverId || 'NULL'}`);
      console.log(`   Created: ${tx.createdAt}`);
    });

    // Check if any withdrawals have fee data
    console.log('\n2️⃣ Checking withdrawals with fee data...');
    const withdrawalsWithFees = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount", "feeReceiverId"
      FROM transactions 
      WHERE type = 'WITHDRAW' AND "feeAmount" > 0
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log(`Found ${withdrawalsWithFees.rows.length} withdrawals with fees:`);
    withdrawalsWithFees.rows.forEach((tx, index) => {
      console.log(`\n${index + 1}. Withdrawal with Fee:`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Fee: $${tx.feeAmount}`);
      console.log(`   Net: $${tx.netAmount}`);
      console.log(`   Type: ${tx.transactionType}`);
    });

    // Check the admin fees query specifically
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
    console.log(`  Total fees: $${adminFees.total_fees}`);
    console.log(`  Total transactions with fees: ${adminFees.total_transactions}`);

    // Check breakdown by transaction type
    console.log('\n4️⃣ Checking breakdown by transaction type...');
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

    // Check if the withdrawal API is actually applying fees
    console.log('\n5️⃣ Checking withdrawal API implementation...');
    
    // Look at the withdrawal API code to see if it's using the fee system
    const fs = require('fs');
    const path = require('path');
    
    try {
      const withdrawalApiPath = path.join(__dirname, '../src/app/api/withdraw/route.js');
      const withdrawalApiCode = fs.readFileSync(withdrawalApiPath, 'utf8');
      
      if (withdrawalApiCode.includes('calculateFee')) {
        console.log('✅ Withdrawal API imports calculateFee');
      } else {
        console.log('❌ Withdrawal API does NOT import calculateFee');
      }
      
      if (withdrawalApiCode.includes('feeAmount')) {
        console.log('✅ Withdrawal API includes feeAmount in transaction creation');
      } else {
        console.log('❌ Withdrawal API does NOT include feeAmount in transaction creation');
      }
      
      if (withdrawalApiCode.includes('transactionType')) {
        console.log('✅ Withdrawal API includes transactionType in transaction creation');
      } else {
        console.log('❌ Withdrawal API does NOT include transactionType in transaction creation');
      }
      
    } catch (error) {
      console.log('❌ Could not read withdrawal API file:', error.message);
    }

    // Check if there are any recent transactions that should have fees
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
    console.error('❌ Error debugging withdrawal:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the debug
if (require.main === module) {
  debugRecentWithdrawal().catch(console.error);
}

module.exports = { debugRecentWithdrawal };







