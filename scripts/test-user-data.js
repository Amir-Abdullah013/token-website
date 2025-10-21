const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testUserData() {
  try {
    console.log('🔍 Testing user data filtering...');
    
    // Test the staking API
    console.log('\n📊 Testing /api/stake endpoint:');
    const stakingResponse = await fetch('http://localhost:3001/api/stake');
    const stakingData = await stakingResponse.json();
    
    if (stakingData.success) {
      console.log('✅ Staking API response:', {
        success: stakingData.success,
        stakingsCount: stakingData.stakings?.length || 0,
        warning: stakingData.warning
      });
      
      if (stakingData.stakings && stakingData.stakings.length > 0) {
        console.log('📋 Sample staking data:', {
          id: stakingData.stakings[0].id,
          userId: stakingData.stakings[0].userId,
          amountStaked: stakingData.stakings[0].amountStaked,
          user_name: stakingData.stakings[0].user_name,
          user_email: stakingData.stakings[0].user_email
        });
      }
    } else {
      console.log('❌ Staking API error:', stakingData.error);
    }
    
    // Test the wallet API
    console.log('\n💰 Testing /api/user/wallet endpoint:');
    const walletResponse = await fetch('http://localhost:3001/api/user/wallet');
    const walletData = await walletResponse.json();
    
    if (walletData.success) {
      console.log('✅ Wallet API response:', {
        success: walletData.success,
        wallet: walletData.wallet ? {
          id: walletData.wallet.id,
          VonBalance: walletData.wallet.VonBalance,
          usdBalance: walletData.wallet.usdBalance
        } : null
      });
    } else {
      console.log('❌ Wallet API error:', walletData.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testUserData();


