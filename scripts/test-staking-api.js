const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testStakingAPI() {
  try {
    console.log('🔍 Testing staking API...');
    
    // Test the staking API without authentication (will fail but we can see the response)
    const response = await fetch('http://localhost:3000/api/stake', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log('📡 Staking API test result:', {
      status: response.status,
      success: data.success,
      error: data.error
    });

    if (response.ok && data.success) {
      console.log('✅ Staking API working correctly');
      console.log('👤 Stakings found:', data.stakings?.length || 0);
    } else {
      console.log('❌ Staking API failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Wait a moment for the server to start
setTimeout(testStakingAPI, 3000);
