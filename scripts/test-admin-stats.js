const { databaseHelpers } = require('../src/lib/database');

const testAdminStats = async () => {
  try {
    console.log('🔍 Testing admin stats API...');
    
    // Test the optimized queries directly
    console.log('📊 Testing user statistics...');
    const userStats = await databaseHelpers.pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN "emailVerified" = true THEN 1 END) as verifiedUsers
      FROM users
    `);
    console.log('✅ User stats:', userStats.rows[0]);
    
    console.log('💰 Testing wallet statistics...');
    const walletStats = await databaseHelpers.pool.query(`
      SELECT 
        COUNT(*) as totalWallets,
        COUNT(CASE WHEN balance > 0 OR "VonBalance" > 0 THEN 1 END) as activeWallets,
        SUM(balance) as totalBalance,
        SUM("VonBalance") as totalVonBalance
      FROM wallets
    `);
    console.log('✅ Wallet stats:', walletStats.rows[0]);
    
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
    console.log('✅ Transaction stats:', transactionStats.rows[0]);
    
    console.log('⏳ Testing pending transactions...');
    const pendingStats = await databaseHelpers.pool.query(`
      SELECT COUNT(*) as pendingTransactions
      FROM transactions
      WHERE status = 'PENDING'
    `);
    console.log('✅ Pending stats:', pendingStats.rows[0]);
    
    // Test recent activity
    console.log('📋 Testing recent activity...');
    const recentUsers = await databaseHelpers.pool.query(`
      SELECT 
        id,
        name,
        email,
        "createdAt"
      FROM users 
      ORDER BY "createdAt" DESC 
      LIMIT 3
    `);
    console.log('✅ Recent users:', recentUsers.rows.length);
    
    const recentTransactions = await databaseHelpers.pool.query(`
      SELECT 
        t.id,
        t.type,
        t.amount,
        t.status,
        t."createdAt",
        u.name as "userName"
      FROM transactions t
      LEFT JOIN users u ON t."userId" = u.id
      ORDER BY t."createdAt" DESC 
      LIMIT 3
    `);
    console.log('✅ Recent transactions:', recentTransactions.rows.length);
    
    console.log('🎉 All admin stats queries working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing admin stats:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await databaseHelpers.pool.end();
  }
};

testAdminStats();
