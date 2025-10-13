// Simple test to check if staking API is working
console.log('🔍 Testing staking functionality...');

// Test if we can access the staking page
fetch('http://localhost:3000/user/staking')
  .then(response => {
    console.log('📡 Staking page response:', response.status);
    if (response.ok) {
      console.log('✅ Staking page loads successfully');
    } else {
      console.log('❌ Staking page failed to load');
    }
  })
  .catch(error => {
    console.log('❌ Error accessing staking page:', error.message);
  });

// Test the staking API endpoint
fetch('http://localhost:3000/api/stake')
  .then(response => {
    console.log('📡 Staking API response:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('📊 Staking API data:', {
      success: data.success,
      stakingsCount: data.stakings?.length || 0,
      warning: data.warning
    });
    if (data.success) {
      console.log('✅ Staking API working correctly');
    } else {
      console.log('❌ Staking API failed:', data.error);
    }
  })
  .catch(error => {
    console.log('❌ Error accessing staking API:', error.message);
  });


