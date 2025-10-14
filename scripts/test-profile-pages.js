const { databaseHelpers } = require('../src/lib/database');

const testProfilePages = async () => {
  try {
    console.log('🔍 Testing profile pages functionality...');
    
    // Test getting a user to check their role
    console.log('👤 Testing user role detection...');
    const testUserId = '93dfb582-f353-47bc-9f23-0b8138b1dfc7'; // Use a real user ID
    const user = await databaseHelpers.user.getUserById(testUserId);
    
    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        country: user.country,
        timezone: user.timezone
      });
      
      // Test role detection logic
      const isUser = user.role === 'user' || user.role === 'USER';
      const isAdmin = user.role === 'admin' || user.role === 'ADMIN';
      
      console.log('🔍 Role detection results:');
      console.log(`  - isUser: ${isUser}`);
      console.log(`  - isAdmin: ${isAdmin}`);
      console.log(`  - Role: ${user.role}`);
      
      // Test profile update functionality
      console.log('🔧 Testing profile update...');
      const updateData = {
        name: user.name || 'Test User',
        phone: user.phone || '+1234567890',
        country: user.country || 'US',
        timezone: user.timezone || 'UTC'
      };
      
      const updatedUser = await databaseHelpers.user.updateUser(testUserId, updateData);
      
      if (updatedUser) {
        console.log('✅ Profile updated successfully:', {
          name: updatedUser.name,
          phone: updatedUser.phone,
          country: updatedUser.country,
          timezone: updatedUser.timezone
        });
      } else {
        console.log('❌ Failed to update profile');
      }
      
    } else {
      console.log('❌ User not found');
    }
    
    console.log('🎉 Profile pages functionality test completed!');
    
  } catch (error) {
    console.error('❌ Error testing profile pages:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await databaseHelpers.pool.end();
  }
};

testProfilePages();
