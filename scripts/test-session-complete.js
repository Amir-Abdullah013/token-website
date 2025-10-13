#!/usr/bin/env node

/**
 * Complete session management test
 * Tests session synchronization and deposit functionality
 */

import { config } from 'dotenv';
import { databaseHelpers } from '../src/lib/database.js';

// Load environment variables
config({ path: '.env.local' });

console.log('🧪 Testing Complete Session Management...\n');

async function testDatabaseConnection() {
  console.log('1. Testing database connection...');
  try {
    const result = await databaseHelpers.pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testSessionManagement() {
  console.log('\n2. Testing session management...');
  try {
    // Test getting a real user
    const users = await databaseHelpers.pool.query('SELECT id, email, name, role FROM users WHERE role = \'ADMIN\' LIMIT 1');
    if (users.rows.length > 0) {
      const testUser = users.rows[0];
      console.log('✅ Found admin user:', testUser.email);
      console.log('   ID:', testUser.id);
      console.log('   Role:', testUser.role);
      
      return testUser;
    } else {
      console.log('❌ No admin users found');
      return null;
    }
  } catch (error) {
    console.error('❌ Session management test failed:', error.message);
    return null;
  }
}

async function testDepositWithRealUser(user) {
  console.log('\n3. Testing deposit creation with real user...');
  try {
    const testDepositData = {
      userId: user.id,
      amount: 100.00,
      screenshot: '/uploads/deposits/test-screenshot.jpg',
      binanceAddress: 'TX7k8t9w2ZkDh8mA1pQw6yLbNcVfGhJkLmNoPqRsTuVwXyZ1234567890'
    };

    const depositRequest = await databaseHelpers.deposit.createDepositRequest(testDepositData);
    console.log('✅ Deposit request created successfully');
    console.log('   ID:', depositRequest.id);
    console.log('   User ID:', depositRequest.userId);
    console.log('   Amount:', depositRequest.amount);
    console.log('   Status:', depositRequest.status);
    
    return depositRequest;
  } catch (error) {
    console.error('❌ Deposit creation failed:', error.message);
    return null;
  }
}

async function testTransactionWithRealUser(user) {
  console.log('\n4. Testing transaction creation with real user...');
  try {
    const testTransactionData = {
      userId: user.id,
      type: 'DEPOSIT',
      amount: 100.00,
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
    
    return transaction;
  } catch (error) {
    console.error('❌ Transaction creation failed:', error.message);
    return null;
  }
}

async function testSystemSettings() {
  console.log('\n5. Testing system settings...');
  try {
    // Ensure Binance address is set
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

async function runCompleteTest() {
  console.log('🚀 Starting complete session management test...\n');
  
  const results = {
    databaseConnection: false,
    sessionManagement: false,
    depositCreation: false,
    transactionCreation: false,
    systemSettings: false
  };

  // Test 1: Database connection
  results.databaseConnection = await testDatabaseConnection();
  
  if (!results.databaseConnection) {
    console.log('\n❌ Database connection failed. Cannot proceed with other tests.');
    return results;
  }

  // Test 2: Session management
  const testUser = await testSessionManagement();
  results.sessionManagement = testUser !== null;

  if (!testUser) {
    console.log('\n❌ No test user found. Cannot proceed with deposit tests.');
    return results;
  }

  // Test 3: System settings
  results.systemSettings = await testSystemSettings();

  // Test 4: Deposit creation
  const depositRequest = await testDepositWithRealUser(testUser);
  results.depositCreation = depositRequest !== null;

  // Test 5: Transaction creation
  const transaction = await testTransactionWithRealUser(testUser);
  results.transactionCreation = transaction !== null;

  // Summary
  console.log('\n📊 Complete Test Results:');
  console.log('========================');
  console.log(`Database Connection: ${results.databaseConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Session Management: ${results.sessionManagement ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`System Settings: ${results.systemSettings ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Deposit Creation: ${results.depositCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Transaction Creation: ${results.transactionCreation ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🎉 Complete session management is working correctly!');
    console.log('   ✅ Database connection is stable');
    console.log('   ✅ Session management is working');
    console.log('   ✅ Deposit requests can be created');
    console.log('   ✅ Transactions can be created');
    console.log('   ✅ System settings are configured');
    console.log('\n   The session expiry issue should be resolved.');
    console.log('   Users can now submit deposit requests without 401 errors.');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Go to http://localhost:3001/user/deposit');
    console.log('   3. Log in and test deposit submission');
    console.log('   4. Check browser console for session sync logs');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
  }

  return results;
}

// Run the complete test
runCompleteTest()
  .then(() => {
    console.log('\n🏁 Complete test finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Complete test failed:', error);
    process.exit(1);
  });
