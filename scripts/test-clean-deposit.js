#!/usr/bin/env node

/**
 * Test script to verify clean deposit page approach
 */

import { config } from 'dotenv';
import { databaseHelpers } from '../src/lib/database.js';

// Load environment variables
config({ path: '.env.local' });

console.log('🧪 Testing Clean Deposit Page Approach...\n');

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

async function testDepositCreation() {
  console.log('\n2. Testing deposit creation...');
  try {
    // Get a real user for testing
    const users = await databaseHelpers.pool.query('SELECT id, email, name FROM users WHERE role = \'ADMIN\' LIMIT 1');
    if (users.rows.length === 0) {
      console.log('❌ No admin users found');
      return false;
    }
    
    const testUser = users.rows[0];
    console.log('✅ Found test user:', testUser.email);
    
    // Test deposit request creation
    const testDepositData = {
      userId: testUser.id,
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
    
    return true;
  } catch (error) {
    console.error('❌ Deposit creation failed:', error.message);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log('\n3. Testing API endpoint...');
  try {
    // Test if the API endpoint is accessible
    const response = await fetch('http://localhost:3001/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 API endpoint response status:', response.status);
    
    if (response.status === 200 || response.status === 401) {
      console.log('✅ API endpoint is accessible');
      return true;
    } else {
      console.log('❌ API endpoint returned unexpected status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('⚠️  API endpoint test failed (server might not be running):', error.message);
    console.log('   Make sure to start the server with: npm run dev');
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting clean deposit page tests...\n');
  
  const results = {
    databaseConnection: false,
    depositCreation: false,
    apiEndpoint: false
  };

  // Test 1: Database connection
  results.databaseConnection = await testDatabaseConnection();
  
  if (!results.databaseConnection) {
    console.log('\n❌ Database connection failed. Cannot proceed with other tests.');
    return results;
  }

  // Test 2: Deposit creation
  results.depositCreation = await testDepositCreation();

  // Test 3: API endpoint
  results.apiEndpoint = await testAPIEndpoint();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Database Connection: ${results.databaseConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Deposit Creation: ${results.depositCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoint: ${results.apiEndpoint ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🎉 Clean deposit page approach is working!');
    console.log('   ✅ Database connection is stable');
    console.log('   ✅ Deposit requests can be created');
    console.log('   ✅ API endpoint is accessible');
    console.log('\n   The simplified approach should work without session issues.');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Go to http://localhost:3001/user/deposit');
    console.log('   3. Log in and test deposit submission');
    console.log('   4. The form should work without complex session logic');
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
