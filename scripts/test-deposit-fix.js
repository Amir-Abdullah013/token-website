#!/usr/bin/env node

/**
 * Test script to verify deposit request functionality
 * This script tests the database connection and deposit request creation
 */

import { databaseHelpers } from '../src/lib/database.js';
import { randomUUID } from 'crypto';

console.log('🧪 Testing Deposit Request Functionality...\n');

async function testDatabaseConnection() {
  console.log('1. Testing database connection...');
  try {
    const result = await databaseHelpers.pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log('   Current time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testDepositRequestCreation() {
  console.log('\n2. Testing deposit request creation...');
  try {
    // Test data
    const testDepositData = {
      userId: 'test-user-' + randomUUID(),
      amount: 100.50,
      screenshot: '/uploads/deposits/test-screenshot.jpg',
      binanceAddress: 'TX7k8t9w2ZkDh8mA1pQw6yLbNcVfGhJkLmNoPqRsTuVwXyZ1234567890'
    };

    const depositRequest = await databaseHelpers.deposit.createDepositRequest(testDepositData);
    console.log('✅ Deposit request created successfully');
    console.log('   ID:', depositRequest.id);
    console.log('   Amount:', depositRequest.amount);
    console.log('   Status:', depositRequest.status);
    
    return depositRequest;
  } catch (error) {
    console.error('❌ Deposit request creation failed:', error.message);
    return null;
  }
}

async function testTransactionCreation() {
  console.log('\n3. Testing transaction creation...');
  try {
    // Test data
    const testTransactionData = {
      userId: 'test-user-' + randomUUID(),
      type: 'DEPOSIT',
      amount: 100.50,
      currency: 'USD',
      status: 'PENDING',
      gateway: 'Binance',
      description: 'Test deposit transaction',
      screenshot: '/uploads/deposits/test-screenshot.jpg',
      binanceAddress: 'TX7k8t9w2ZkDh8mA1pQw6yLbNcVfGhJkLmNoPqRsTuVwXyZ1234567890'
    };

    const transaction = await databaseHelpers.transaction.createTransaction(testTransactionData);
    console.log('✅ Transaction created successfully');
    console.log('   ID:', transaction.id);
    console.log('   Type:', transaction.type);
    console.log('   Amount:', transaction.amount);
    console.log('   Status:', transaction.status);
    
    return transaction;
  } catch (error) {
    console.error('❌ Transaction creation failed:', error.message);
    return null;
  }
}

async function testSystemSettings() {
  console.log('\n4. Testing system settings...');
  try {
    const binanceAddress = await databaseHelpers.system.getSetting('BINANCE_DEPOSIT_ADDRESS');
    if (binanceAddress) {
      console.log('✅ Binance address found in system settings');
      console.log('   Address:', binanceAddress.value);
    } else {
      console.log('⚠️  Binance address not found in system settings, using fallback');
    }
    return true;
  } catch (error) {
    console.error('❌ System settings test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive deposit functionality tests...\n');
  
  const results = {
    databaseConnection: false,
    depositRequest: false,
    transaction: false,
    systemSettings: false
  };

  // Test 1: Database connection
  results.databaseConnection = await testDatabaseConnection();
  
  if (!results.databaseConnection) {
    console.log('\n❌ Database connection failed. Cannot proceed with other tests.');
    return results;
  }

  // Test 2: System settings
  results.systemSettings = await testSystemSettings();

  // Test 3: Deposit request creation
  const depositRequest = await testDepositRequestCreation();
  results.depositRequest = depositRequest !== null;

  // Test 4: Transaction creation
  const transaction = await testTransactionCreation();
  results.transaction = transaction !== null;

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Database Connection: ${results.databaseConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`System Settings: ${results.systemSettings ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Deposit Request: ${results.depositRequest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Transaction Creation: ${results.transaction ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🎉 Deposit functionality is working correctly!');
    console.log('   You can now submit deposit requests through the web interface.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
    console.log('   The deposit functionality may not work correctly.');
  }

  return results;
}

// Run the tests
runAllTests()
  .then(() => {
    console.log('\n🏁 Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });
