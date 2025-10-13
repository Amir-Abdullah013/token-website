#!/usr/bin/env node

/**
 * Test script to check API response format
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('🧪 Testing API Response Format...\n');

async function testAPIResponse() {
  console.log('1. Testing API response format...');
  
  try {
    // Test the session endpoint first
    console.log('🔍 Testing session endpoint...');
    const sessionResponse = await fetch('http://localhost:3001/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Session response status:', sessionResponse.status);
    const sessionText = await sessionResponse.text();
    console.log('📄 Session response text:', sessionText);
    
    if (sessionText) {
      try {
        const sessionData = JSON.parse(sessionText);
        console.log('📊 Session response data:', sessionData);
      } catch (parseError) {
        console.log('❌ Failed to parse session response:', parseError.message);
      }
    }
    
    // Test the deposit endpoint with mock data
    console.log('\n🔍 Testing deposit endpoint...');
    
    // Create mock form data
    const formData = new FormData();
    formData.append('amount', '100.00');
    
    // Create a mock file
    const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('screenshot', mockFile);
    
    const depositResponse = await fetch('http://localhost:3001/api/deposit', {
      method: 'POST',
      body: formData
    });
    
    console.log('📥 Deposit response status:', depositResponse.status);
    console.log('📥 Deposit response headers:', Object.fromEntries(depositResponse.headers.entries()));
    
    const depositText = await depositResponse.text();
    console.log('📄 Deposit response text:', depositText);
    
    if (depositText) {
      try {
        const depositData = JSON.parse(depositText);
        console.log('📊 Deposit response data:', depositData);
      } catch (parseError) {
        console.log('❌ Failed to parse deposit response:', parseError.message);
      }
    } else {
      console.log('⚠️  Empty response from deposit API');
    }
    
    return true;
  } catch (error) {
    console.error('❌ API response test failed:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Starting API response test...\n');
  
  const result = await testAPIResponse();
  
  if (result) {
    console.log('\n✅ API response test completed');
    console.log('   Check the logs above for detailed response information');
  } else {
    console.log('\n❌ API response test failed');
  }
  
  return result;
}

// Run the test
runTest()
  .then(() => {
    console.log('\n🏁 Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });
