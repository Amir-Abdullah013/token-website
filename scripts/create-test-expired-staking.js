const { databaseHelpers } = require('../src/lib/database');

const createTestExpiredStaking = async () => {
  try {
    console.log('🧪 Creating Test Expired Staking...');
    console.log('=====================================\n');

    // Get a test user
    const testUser = await databaseHelpers.pool.query(`
      SELECT * FROM users WHERE email = 'website@gmail.com' LIMIT 1
    `);
    
    if (testUser.rows.length === 0) {
      console.log('❌ Test user not found');
      return;
    }
    
    const user = testUser.rows[0];
    console.log(`👤 Using test user: ${user.name} (${user.email})`);
    
    // Get user's current wallet balance
    const userWallet = await databaseHelpers.wallet.getWalletByUserId(user.id);
    console.log(`💰 Current Von balance: ${userWallet.VonBalance} Von`);
    
    // Create an expired staking (end date in the past)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 8); // Started 8 days ago
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Ended 1 day ago
    
    const stakingAmount = 50; // 50 Von
    const durationDays = 7;
    const rewardPercent = 2; // 2% reward
    
    console.log(`\n📊 Creating expired staking:`);
    console.log(`   Amount: ${stakingAmount} Von`);
    console.log(`   Duration: ${durationDays} days`);
    console.log(`   Reward: ${rewardPercent}%`);
    console.log(`   Start Date: ${startDate.toLocaleString()}`);
    console.log(`   End Date: ${endDate.toLocaleString()}`);
    console.log(`   Status: EXPIRED (ready for processing)`);
    
    // Create the staking record
    const staking = await databaseHelpers.staking.createStaking({
      userId: user.id,
      amountStaked: stakingAmount,
      durationDays,
      rewardPercent,
      startDate,
      endDate
    });
    
    console.log(`✅ Expired staking created with ID: ${staking.id}`);
    
    // Deduct Von from user's wallet to simulate the staking
    const newBalance = userWallet.VonBalance - stakingAmount;
    await databaseHelpers.wallet.updateVonBalance(user.id, -stakingAmount);
    
    console.log(`💰 User balance updated: ${userWallet.VonBalance} → ${newBalance} Von (-${stakingAmount})`);
    
    // Calculate expected rewards
    const rewardAmount = (stakingAmount * rewardPercent) / 100;
    const totalAmount = stakingAmount + rewardAmount;
    
    console.log(`\n📈 Expected rewards when processed:`);
    console.log(`   Staked Amount: ${stakingAmount} Von`);
    console.log(`   Reward Amount: ${rewardAmount} Von (${rewardPercent}%)`);
    console.log(`   Total to receive: ${totalAmount} Von`);
    console.log(`   New balance will be: ${newBalance + totalAmount} Von`);
    
    console.log(`\n🎯 This staking is now ready for automatic processing!`);
    console.log(`   Run the test again to see it get processed automatically.`);
    
  } catch (error) {
    console.error('❌ Error creating test expired staking:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
};

createTestExpiredStaking();



