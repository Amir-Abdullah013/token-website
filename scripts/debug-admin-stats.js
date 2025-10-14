const { databaseHelpers } = require('../src/lib/database');

const debugAdminStats = async () => {
  try {
    console.log('🔍 Debugging admin stats API...');
    
    // Test each query individually
    console.log('📊 Testing user statistics...');
    const userStats = await databaseHelpers.pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN "emailVerified" = true THEN 1 END) as verifiedUsers
      FROM users
    `);
    console.log('✅ User stats result:', userStats.rows[0]);
    
    console.log('💰 Testing wallet statistics...');
    const walletStats = await databaseHelpers.pool.query(`
      SELECT 
        COUNT(*) as totalWallets,
        COUNT(CASE WHEN balance > 0 OR "tikiBalance" > 0 THEN 1 END) as activeWallets,
        SUM(balance) as totalBalance,
        SUM("tikiBalance") as totalTikiBalance
      FROM wallets
    `);
    console.log('✅ Wallet stats result:', walletStats.rows[0]);
    
    console.log('💳 Testing transaction statistics...');
    const transactionStats = await databaseHelpers.pool.query(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(CASE WHEN type = 'DEPOSIT' THEN amount ELSE 0 END) as totalDeposits,
        SUM(CASE WHEN type = 'BUY' THEN amount ELSE 0 END) as totalBuys,
        COUNT(CASE WHEN type = 'DEPOSIT' THEN 1 END) as depositCount,
        COUNT(CASE WHEN type = 'BUY' THEN 1 END) as buyCount
      FROM transactions
      WHERE status = 'COMPLETED'
    `);
    console.log('✅ Transaction stats result:', transactionStats.rows[0]);
    
    console.log('⏳ Testing pending transactions...');
    const pendingStats = await databaseHelpers.pool.query(`
      SELECT COUNT(*) as pendingTransactions
      FROM transactions
      WHERE status = 'PENDING'
    `);
    console.log('✅ Pending stats result:', pendingStats.rows[0]);
    
    // Test the complete API logic
    console.log('\n🔧 Testing complete API logic...');
    
    const userData = userStats.rows[0];
    const walletData = walletStats.rows[0];
    const transactionData = transactionStats.rows[0];
    const pendingData = pendingStats.rows[0];

    const stats = {
      totalUsers: parseInt(userData.totalusers) || 0,
      verifiedUsers: parseInt(userData.verifiedusers) || 0,
      activeWallets: parseInt(walletData.activewallets) || 0,
      totalWallets: parseInt(walletData.totalwallets) || 0,
      totalBalance: parseFloat(walletData.totalbalance) || 0,
      totalTikiBalance: parseFloat(walletData.totaltikibalance) || 0,
      totalDeposits: parseFloat(transactionData.totaldeposits) || 0,
      totalWithdrawals: 0,
      totalBuys: parseFloat(transactionData.totalbuys) || 0,
      totalSells: 0,
      depositCount: parseInt(transactionData.depositcount) || 0,
      buyCount: parseInt(transactionData.buycount) || 0,
      pendingTransactions: parseInt(pendingData.pendingtransactions) || 0,
      totalTransactions: parseInt(transactionData.totaltransactions) || 0
    };

    console.log('📋 Final stats object:', stats);
    
    // Check if any values are null or undefined
    console.log('\n🔍 Checking for null/undefined values:');
    Object.entries(stats).forEach(([key, value]) => {
      if (value === 0) {
        console.log(`⚠️  ${key}: ${value} (might be 0 or null)`);
      } else {
        console.log(`✅ ${key}: ${value}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging admin stats:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await databaseHelpers.pool.end();
  }
};

debugAdminStats();
