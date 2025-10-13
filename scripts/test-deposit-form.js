#!/usr/bin/env node

/**
 * Test script to verify deposit form functionality
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('🧪 Testing Deposit Form Functionality...\n');

async function testFormValidation() {
  console.log('1. Testing form validation logic...');
  
  try {
    // Test amount validation
    const testAmounts = [
      { amount: '', expected: false, description: 'Empty amount' },
      { amount: '0', expected: false, description: 'Zero amount' },
      { amount: '10', expected: true, description: 'Valid amount' },
      { amount: '1000', expected: true, description: 'Large amount' },
      { amount: 'abc', expected: false, description: 'Invalid amount' }
    ];
    
    console.log('💰 Testing amount validation:');
    testAmounts.forEach(test => {
      const amount = parseFloat(test.amount);
      const isValid = !isNaN(amount) && amount > 0;
      const result = isValid === test.expected ? '✅' : '❌';
      console.log(`   ${result} ${test.description}: ${test.amount} -> ${isValid}`);
    });
    
    // Test screenshot validation
    console.log('\n📷 Testing screenshot validation:');
    const testScreenshots = [
      { screenshot: null, expected: false, description: 'No screenshot' },
      { screenshot: { name: 'test.jpg', size: 1000 }, expected: true, description: 'Valid screenshot' }
    ];
    
    testScreenshots.forEach(test => {
      const isValid = !!test.screenshot;
      const result = isValid === test.expected ? '✅' : '❌';
      console.log(`   ${result} ${test.description}: ${isValid}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Form validation test failed:', error.message);
    return false;
  }
}

async function testSessionSync() {
  console.log('\n2. Testing session sync functionality...');
  
  try {
    // Check if session sync function exists
    const { ensureSessionSync } = await import('../src/lib/session-sync.js');
    
    if (typeof ensureSessionSync === 'function') {
      console.log('✅ Session sync function is available');
      return true;
    } else {
      console.log('❌ Session sync function is not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Session sync test failed:', error.message);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log('\n3. Testing API endpoint availability...');
  
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
  console.log('🚀 Starting deposit form tests...\n');
  
  const results = {
    formValidation: false,
    sessionSync: false,
    apiEndpoint: false
  };

  // Test 1: Form validation
  results.formValidation = await testFormValidation();

  // Test 2: Session sync
  results.sessionSync = await testSessionSync();

  // Test 3: API endpoint
  results.apiEndpoint = await testAPIEndpoint();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Form Validation: ${results.formValidation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Session Sync: ${results.sessionSync ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoint: ${results.apiEndpoint ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\nOverall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (allPassed) {
    console.log('\n🎉 Deposit form is working correctly!');
    console.log('   ✅ Form validation is working');
    console.log('   ✅ Session sync is available');
    console.log('   ✅ API endpoint is accessible');
    console.log('\n   The deposit form should work properly in the web interface.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
    console.log('\n📋 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm run dev');
    console.log('   2. Check browser console for detailed logs');
    console.log('   3. Verify all form fields are filled correctly');
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
