const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAuthSession() {
  try {
    console.log('🔍 Testing authentication and session...');
    
    // Test auth status
    console.log('\n🔐 Testing /api/auth/user-status endpoint:');
    const authResponse = await fetch('http://localhost:3001/api/auth/user-status');
    const authData = await authResponse.json();
    
    console.log('Auth status response:', {
      success: authData.success,
      user: authData.user,
      error: authData.error
    });
    
    // Test with cookies (simulate browser request)
    console.log('\n🍪 Testing with cookie simulation...');
    const cookieResponse = await fetch('http://localhost:3001/api/stake', {
      headers: {
        'Cookie': 'session=test-session; admin-token=test-token'
      }
    });
    const cookieData = await cookieResponse.json();
    
    console.log('Cookie test response:', {
      success: cookieData.success,
      stakingsCount: cookieData.stakings?.length || 0,
      error: cookieData.error
    });
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAuthSession();


