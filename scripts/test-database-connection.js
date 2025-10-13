const { databaseHelpers } = require('../src/lib/database');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    console.log('\n📊 Testing basic database query:');
    const users = await databaseHelpers.user.getAllUsers();
    console.log('✅ Users found:', users.length);
    
    // Test deposit_requests table
    console.log('\n💰 Testing deposit_requests table:');
    try {
      const depositRequests = await databaseHelpers.deposit.getAllDepositRequests();
      console.log('✅ Deposit requests found:', depositRequests.length);
    } catch (error) {
      console.log('❌ Deposit requests table error:', error.message);
    }
    
    // Test creating a deposit request
    console.log('\n📝 Testing createDepositRequest:');
    try {
      const testDeposit = await databaseHelpers.deposit.createDepositRequest({
        userId: 'test-user-id',
        amount: 100,
        screenshot: '/test/screenshot.jpg',
        binanceAddress: 'test-address'
      });
      console.log('✅ Test deposit request created:', testDeposit.id);
    } catch (error) {
      console.log('❌ Create deposit request error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
}

testDatabaseConnection();