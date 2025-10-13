#!/usr/bin/env node

/**
 * Test script to verify deposit request functionality with real user
 */

import { databaseHelpers } from '../src/lib/database.js';

console.log('🧪 Testing Deposit Request Functionality with Real User...\n');

async function testDepositRequestWithRealUser() {
  console.log('1. Testing deposit request creation with real user...');
  try {
    // Use a real user ID from the database
    const realUserId = '1f1fffe0-3e3b-40cb-a8e1-3be943a186fd'; // Amir Abdullah (ADMIN)
    
    const testDepositData = {
      userId: realUserId,
      amount: 100.50,
      screenshot: '/uploads/deposits/test-screenshot.jpg',
      binanceAddress: 'TX7k8t9w2ZkDh8mA1pQw6yLbNcVfGhJkLmNoPqRsTuVwXyZ1234567890'
    };

    const depositRequest = await databaseHelpers.deposit.createDepositRequest(testDepositData);
    console.log('✅ Deposit request created successfully');
    console.log('   ID:', depositRequest.id);
    console.log('   User ID:', depositRequest.userId);
    console.log('   Amount:', depositRequest.amount);
    console.log('   Status:', depositRequest.status);
    console.log('   Created At:', depositRequest.createdAt);
    
    return depositRequest;
  } catch (error) {
    console.error('❌ Deposit request creation failed:', error.message);
    return null;
  }
}

async function testTransactionWithRealUser() {
  console.log('\n2. Testing transaction creation with real user...');
  try {
    // Use a real user ID from the database
    const realUserId = '1f1fffe0-3e3b-40cb-a8e1-3be943a186fd'; // Amir Abdullah (ADMIN)
    
    const testTransactionData = {
      userId: realUserId,
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
    console.log('   User ID:', transaction.userId);
    console.log('   Type:', transaction.type);
    console.log('   Amount:', transaction.amount);
    console.log('   Status:', transaction.status);
    console.log('   Created At:', transaction.createdAt);
    
    return transaction;
  } catch (error) {
    console.error('❌ Transaction creation failed:', error.message);
    return null;
  }
}

async function testSystemSettings() {
  console.log('\n3. Testing system settings...');
  try {
    // Try to get or set Binance address
    let binanceAddress = await databaseHelpers.system.getSetting('BINANCE_DEPOSIT_ADDRESS');
    
    if (!binanceAddress) {
      console.log('⚠️  Binance address not found, creating one...');
      binanceAddress = await databaseHelpers.system.setSetting('BINANCE_DEPOSIT_ADDRESS', 'TX7k8t9w2ZkDh8mA1pQw6yLbNcVfGhJkLmNoPqRsTuVwXyZ1234567890', 'Default Binance deposit address');
    }
    
    console.log('✅ Binance address configured');
    console.log('   Address:', binanceAddress.value);
    
    return true;
  } catch (error) {
    console.error('❌ System settings test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting deposit functionality tests with real user...\n');
  
  const results = {
    depositRequest: false,
    transaction: false,
    systemSettings: false
  };

  // Test 1: System settings
  results.systemSettings = await testSystemSettings();

  // Test 2: Deposit request creation
  const depositRequest = await testDepositRequestWithRealUser();
  results.depositRequest = depositRequest !== null;

  // Test 3: Transaction creation
  const transaction = await testTransactionWithRealUser();
  results.transaction = transaction !== null;

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`System Settings: ${results.systemSettings ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Deposit Request: ${results.depositRequest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Transaction Creation: ${results.transaction ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🎉 Deposit functionality is working correctly!');
    console.log('   ✅ Database connection is stable');
    console.log('   ✅ Deposit requests can be created');
    console.log('   ✅ Transactions can be created');
    console.log('   ✅ System settings are working');
    console.log('\n   The deposit request feature should work properly in the web interface.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
  }

  return results;
}

// Run the tests
runTests()
  .then(() => {
    console.log('\n🏁 Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });
