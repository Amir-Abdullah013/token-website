const fetch = require('node-fetch');

async function testUserStakings() {
  try {
    console.log('🔍 Testing user stakings API...');
    
    // Test the user stakings API
    const response = await fetch('http://localhost:3001/api/stake', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper authentication
        // This is just to test the API structure
      },
    });

    const data = await response.json();
    
    console.log('📡 User stakings API test result:', {
      status: response.status,
      success: data.success,
      error: data.error,
      stakingsCount: data.stakings?.length || 0
    });

    if (response.ok && data.success) {
      console.log('✅ User stakings API working correctly');
      console.log('👤 Stakings found:', data.stakings?.length || 0);
      if (data.stakings && data.stakings.length > 0) {
        console.log('📊 Sample staking:', {
          id: data.stakings[0].id,
          userId: data.stakings[0].userId,
          amountStaked: data.stakings[0].amountStaked,
          status: data.stakings[0].status
        });
      }
    } else {
      console.log('❌ User stakings API failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Wait a moment for the server to start
setTimeout(testUserStakings, 3000);

