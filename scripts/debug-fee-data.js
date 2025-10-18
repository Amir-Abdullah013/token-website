#!/usr/bin/env node

/**
 * Debug Fee Data Script
 * Check what transaction data exists and why fees aren't showing
 */

const { databaseHelpers } = require('../src/lib/database');

async function debugFeeData() {
  console.log('🔍 Debugging Fee Data...\n');

  try {
    // Check if transactions table exists and has data
    console.log('1️⃣ Checking transactions table...');
    const tableExists = await databaseHelpers.pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transactions'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Transactions table does not exist');
      return;
    }
    console.log('✅ Transactions table exists');

    // Check total transaction count
    const totalCount = await databaseHelpers.pool.query('SELECT COUNT(*) as count FROM transactions');
    console.log(`📊 Total transactions: ${totalCount.rows[0].count}`);

    // Check recent transactions
    console.log('\n2️⃣ Recent transactions (last 10):');
    const recentTransactions = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "createdAt",
        "feeAmount", "transactionType", "netAmount"
      FROM transactions 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `);
    
    console.log('Recent transactions:');
    recentTransactions.rows.forEach((tx, index) => {
      console.log(`${index + 1}. ID: ${tx.id}`);
      console.log(`   Type: ${tx.type}`);
      console.log(`   Amount: $${tx.amount}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Fee Amount: ${tx.feeAmount || 'NULL'}`);
      console.log(`   Transaction Type: ${tx.transactionType || 'NULL'}`);
      console.log(`   Net Amount: ${tx.netAmount || 'NULL'}`);
      console.log(`   Created: ${tx.createdAt}`);
      console.log('   ---');
    });

    // Check transactions with fees
    console.log('\n3️⃣ Transactions with fees:');
    const transactionsWithFees = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, "feeAmount", "transactionType", "netAmount", "createdAt"
      FROM transactions 
      WHERE "feeAmount" > 0
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${transactionsWithFees.rows.length} transactions with fees:`);
    transactionsWithFees.rows.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type} - $${tx.amount} (Fee: $${tx.feeAmount}, Net: $${tx.netAmount})`);
    });

    // Check transactions by type
    console.log('\n4️⃣ Transactions by type:');
    const byType = await databaseHelpers.pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        SUM("feeAmount") as total_fees,
        AVG("feeAmount") as avg_fee
      FROM transactions 
      GROUP BY type
      ORDER BY count DESC
    `);
    
    byType.rows.forEach(row => {
      console.log(`${row.type}: ${row.count} transactions, $${row.total_amount} total, $${row.total_fees || 0} fees`);
    });

    // Check if there are any withdrawal transactions specifically
    console.log('\n5️⃣ Withdrawal transactions:');
    const withdrawals = await databaseHelpers.pool.query(`
      SELECT 
        id, type, amount, status, "feeAmount", "transactionType", "netAmount", "createdAt"
      FROM transactions 
      WHERE type = 'WITHDRAW' OR type = 'withdraw' OR "transactionType" = 'withdraw'
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log(`Found ${withdrawals.rows.length} withdrawal transactions:`);
    withdrawals.rows.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.type} - $${tx.amount} (Fee: ${tx.feeAmount || 'NULL'}, Net: ${tx.netAmount || 'NULL'})`);
    });

    // Check table schema
    console.log('\n6️⃣ Transactions table schema:');
    const schema = await databaseHelpers.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('Table columns:');
    schema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Error debugging fee data:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
}

// Run the debug
if (require.main === module) {
  debugFeeData().catch(console.error);
}

module.exports = { debugFeeData };








