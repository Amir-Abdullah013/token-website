const { databaseHelpers } = require('../src/lib/database');

const testRecentActivity = async () => {
  try {
    console.log('🔍 Testing recent activity API...');
    
    // Test recent users
    console.log('👥 Testing recent users...');
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
    
    // Test recent transactions
    console.log('💳 Testing recent transactions...');
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
    
    // Test recent staking
    console.log('🏦 Testing recent staking...');
    const recentStaking = await databaseHelpers.pool.query(`
      SELECT 
        s.id,
        s."amountStaked",
        s.status,
        s."createdAt",
        u.name as "userName"
      FROM staking s
      LEFT JOIN users u ON s."userId" = u.id
      ORDER BY s."createdAt" DESC 
      LIMIT 3
    `);
    console.log('✅ Recent staking:', recentStaking.rows.length);
    
    if (recentUsers.rows.length > 0) {
      console.log('📋 Sample user:', recentUsers.rows[0]);
    }
    
    if (recentTransactions.rows.length > 0) {
      console.log('📋 Sample transaction:', recentTransactions.rows[0]);
    }
    
    if (recentStaking.rows.length > 0) {
      console.log('📋 Sample staking:', recentStaking.rows[0]);
    }
    
    console.log('🎉 All recent activity queries working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing recent activity:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await databaseHelpers.pool.end();
  }
};

testRecentActivity();
