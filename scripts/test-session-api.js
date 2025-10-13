#!/usr/bin/env node

/**
 * Test script to check session and API communication
 */

import { config } from 'dotenv';
import { databaseHelpers } from '../src/lib/database.js';

// Load environment variables
config({ path: '.env.local' });

console.log('🧪 Testing Session and API Communication...\n');

async function testSessionRetrieval() {
  console.log('1. Testing session retrieval...');
  try {
    // Import session functions
    const { getServerSession, getUserRole } = await import('../src/lib/session.js');
    
    // Test session retrieval
    const session = await getServerSession();
    console.log('👤 Session retrieved:', session ? { 
      id: session.id, 
      email: session.email,
      name: session.name 
    } : 'No session');
    
    if (session) {
      const role = await getUserRole(session);
      console.log('👑 User role:', role);
      return true;
    } else {
      console.log('❌ No session found');
      return false;
    }
  } catch (error) {
    console.error('❌ Session retrieval failed:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n2. Testing database connection...');
  try {
    const result = await databaseHelpers.pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testUserExists() {
  console.log('\n3. Testing user existence...');
  try {
    // Get a test user
    const users = await databaseHelpers.pool.query('SELECT id, email, name, role FROM users LIMIT 1');
    if (users.rows.length === 0) {
      console.log('❌ No users found in database');
      return false;
    }
    
    const testUser = users.rows[0];
    console.log('✅ Found test user:', {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role
    });
    
    return testUser;
  } catch (error) {
    console.error('❌ User existence check failed:', error.message);
    return false;
  }
}

async function testDepositCreation() {
  console.log('\n4. Testing deposit creation...');
  try {
    // Get a test user
    const users = await databaseHelpers.pool.query('SELECT id, email FROM users WHERE role = \'ADMIN\' LIMIT 1');
    if (users.rows.length === 0) {
      console.log('❌ No admin users found');
      return false;
    }
    
    const testUser = users.rows[0];
    console.log('👤 Using test user:', testUser.email);
    
    // Test deposit request creation
    const testDepositData = {
      userId: testUser.id,
      amount: 50.00,
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
  console.log('\n5. Testing API endpoint...');
  try {
    // Test if the API endpoint is accessible
    const response = await fetch('http://localhost:3001/api/deposit', {
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
  console.log('🚀 Starting session and API tests...\n');
  
  const results = {
    sessionRetrieval: false,
    databaseConnection: false,
    userExists: false,
    depositCreation: false,
    apiEndpoint: false
  };

  // Test 1: Session retrieval
  results.sessionRetrieval = await testSessionRetrieval();
  
  // Test 2: Database connection
  results.databaseConnection = await testDatabaseConnection();
  
  if (!results.databaseConnection) {
    console.log('\n❌ Database connection failed. Cannot proceed with other tests.');
    return results;
  }

  // Test 3: User existence
  results.userExists = await testUserExists();

  // Test 4: Deposit creation
  results.depositCreation = await testDepositCreation();

  // Test 5: API endpoint
  results.apiEndpoint = await testAPIEndpoint();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Session Retrieval: ${results.sessionRetrieval ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Connection: ${results.databaseConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Exists: ${results.userExists ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Deposit Creation: ${results.depositCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoint: ${results.apiEndpoint ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🎉 Session and API communication is working!');
    console.log('   ✅ Session can be retrieved');
    console.log('   ✅ Database connection is stable');
    console.log('   ✅ Users exist in database');
    console.log('   ✅ Deposit requests can be created');
    console.log('   ✅ API endpoint is accessible');
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Go to http://localhost:3001/user/deposit');
    console.log('   3. Log in and test deposit submission');
    console.log('   4. Check browser console for detailed logs');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
    
    if (!results.sessionRetrieval) {
      console.log('\n🔧 Session Issue: The session is not being retrieved properly.');
      console.log('   This could be due to:');
      console.log('   - Missing session cookies');
      console.log('   - Session not being set properly');
      console.log('   - Authentication flow issues');
    }
    
    if (!results.apiEndpoint) {
      console.log('\n🔧 API Issue: The API endpoint is not accessible.');
      console.log('   Make sure the development server is running: npm run dev');
    }
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
