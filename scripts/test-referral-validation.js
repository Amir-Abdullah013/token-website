const { databaseHelpers } = require('../src/lib/database');

const testReferralValidation = async () => {
  try {
    console.log('🔍 Testing referral validation...');
    
    const testUserId = '93dfb582-f353-47bc-9f23-0b8138b1dfc7';
    console.log('Testing with user ID:', testUserId);
    
    // Test getUserById function
    const user = await databaseHelpers.user.getUserById(testUserId);
    
    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    } else {
      console.log('❌ User not found');
    }
    
    // Test if user exists in database
    const allUsers = await databaseHelpers.pool.query('SELECT id, email, name FROM users LIMIT 5');
    console.log('📋 Sample users in database:');
    allUsers.rows.forEach(user => {
      console.log(`  - ${user.id}: ${user.email} (${user.name})`);
    });
    
  } catch (error) {
    console.error('❌ Error testing referral validation:', error);
  } finally {
    await databaseHelpers.pool.end();
  }
};

testReferralValidation();
