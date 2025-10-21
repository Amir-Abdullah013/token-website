const { databaseHelpers } = require('../src/lib/database');

const setupAutoStaking = async () => {
  try {
    console.log('🔧 Setting up automatic staking system...');
    
    // Test the automatic staking processing endpoint
    console.log('🧪 Testing automatic staking processing...');
    
    // Check if there are any stakings ready for processing
    const readyStakings = await databaseHelpers.pool.query(`
      SELECT s.*, u.name as user_name, u.email as user_email
      FROM staking s
      LEFT JOIN users u ON s."userId" = u.id
      WHERE s.status = 'ACTIVE' 
      AND s."endDate" <= NOW()
      ORDER BY s."endDate" ASC
    `);
    
    console.log(`📊 Found ${readyStakings.rows.length} stakings ready for automatic processing`);
    
    if (readyStakings.rows.length > 0) {
      console.log('📋 Ready stakings:');
      readyStakings.rows.forEach((staking, index) => {
        console.log(`  ${index + 1}. User: ${staking.user_name} (${staking.user_email})`);
        console.log(`     Amount: ${staking.amountStaked} Von`);
        console.log(`     Duration: ${staking.durationDays} days`);
        console.log(`     Reward: ${staking.rewardPercent}%`);
        console.log(`     End Date: ${new Date(staking.endDate).toLocaleString()}`);
        console.log(`     Status: ${staking.status}`);
        console.log('');
      });
    }
    
    // Test the cron endpoint
    console.log('🔄 Testing cron endpoint...');
    const response = await fetch('http://localhost:3000/api/cron/process-stakings');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cron endpoint working:', data);
    } else {
      console.log('⚠️ Cron endpoint not accessible (this is normal if server is not running)');
    }
    
    console.log('🎉 Automatic staking system setup complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Set up a cron job to call /api/cron/process-stakings every hour');
    console.log('2. Example cron entry: 0 * * * * curl -X GET http://your-domain.com/api/cron/process-stakings');
    console.log('3. Or use a service like Vercel Cron Jobs or similar');
    console.log('');
    console.log('🔧 Manual processing:');
    console.log('- Call GET /api/cron/process-stakings to manually process stakings');
    console.log('- This will automatically complete stakings that have reached their end date');
    console.log('- Rewards and referral bonuses will be distributed automatically');
    
  } catch (error) {
    console.error('❌ Error setting up automatic staking:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
};

setupAutoStaking();



