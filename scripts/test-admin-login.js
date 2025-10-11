const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login API...');
    
    const response = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'website@gmail.com',
        password: 'password123' // Replace with actual password
      }),
    });

    const data = await response.json();
    
    console.log('📡 Admin login test result:', {
      status: response.status,
      success: data.success,
      error: data.error,
      message: data.message
    });

    if (response.ok && data.success) {
      console.log('✅ Admin login successful!');
      console.log('👤 User:', data.user);
    } else {
      console.log('❌ Admin login failed:', data.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Wait a moment for the server to start
setTimeout(testAdminLogin, 3000);

