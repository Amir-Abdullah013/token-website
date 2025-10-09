const { databaseHelpers } = require('./src/lib/database');

async function testStatusPersistence() {
  console.log('🧪 Testing status persistence...');
  
  try {
    // Get all users first
    console.log('📊 Fetching all users...');
    const allUsers = await databaseHelpers.user.getAllUsers();
    console.log('✅ Users fetched:', allUsers.length);
    
    if (allUsers.length > 0) {
      const testUser = allUsers[0];
      console.log('👤 Test user:', {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        status: testUser.status
      });
      
      // Test status update
      console.log('🔄 Updating user status to inactive...');
      const updatedUser = await databaseHelpers.user.updateUserStatus(testUser.id, 'inactive');
      console.log('✅ Status updated:', {
        id: updatedUser.id,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt
      });
      
      // Verify the update
      console.log('🔍 Verifying status update...');
      const verifyUser = await databaseHelpers.user.getUserById(testUser.id);
      console.log('✅ Verification result:', {
        id: verifyUser.id,
        status: verifyUser.status,
        updatedAt: verifyUser.updatedAt
      });
      
      // Test changing back to active
      console.log('🔄 Changing status back to active...');
      const reactivatedUser = await databaseHelpers.user.updateUserStatus(testUser.id, 'active');
      console.log('✅ Status reactivated:', {
        id: reactivatedUser.id,
        status: reactivatedUser.status,
        updatedAt: reactivatedUser.updatedAt
      });
      
    } else {
      console.log('❌ No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error testing status persistence:', error);
  }
}

testStatusPersistence();
