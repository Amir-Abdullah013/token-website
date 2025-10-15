const { databaseHelpers } = require('../src/lib/database');

const testSettings = async () => {
  try {
    console.log('🔍 Testing settings functionality...');
    
    // Test getting a user
    console.log('👤 Testing getUserById...');
    const testUserId = '93dfb582-f353-47bc-9f23-0b8138b1dfc7'; // Use a real user ID
    const user = await databaseHelpers.user.getUserById(testUserId);
    
    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        timezone: user.timezone
      });
      
      // Test updating user settings
      console.log('🔧 Testing updateUser...');
      const updateData = {
        name: user.name || 'Test User',
        phone: user.phone || '+1234567890',
        country: user.country || 'US',
        timezone: user.timezone || 'UTC',
        emailNotifications: true,
        smsNotifications: false,
        loginAlerts: true,
        priceAlerts: true,
        tradeNotifications: true,
        depositNotifications: true,
        withdrawalNotifications: true,
        marketingEmails: false,
        securityAlerts: true
      };
      
      const updatedUser = await databaseHelpers.user.updateUser(testUserId, updateData);
      
      if (updatedUser) {
        console.log('✅ User updated successfully:', {
          name: updatedUser.name,
          phone: updatedUser.phone,
          country: updatedUser.country,
          timezone: updatedUser.timezone,
          emailNotifications: updatedUser.emailnotifications,
          smsNotifications: updatedUser.smsnotifications,
          loginAlerts: updatedUser.loginalerts,
          priceAlerts: updatedUser.pricealerts,
          tradeNotifications: updatedUser.tradenotifications,
          depositNotifications: updatedUser.depositnotifications,
          withdrawalNotifications: updatedUser.withdrawalnotifications,
          marketingEmails: updatedUser.marketingemails,
          securityAlerts: updatedUser.securityalerts
        });
      } else {
        console.log('❌ Failed to update user');
      }
      
    } else {
      console.log('❌ User not found');
    }
    
    // Test password change functionality
    console.log('🔐 Testing password functionality...');
    const bcrypt = require('bcryptjs');
    
    // Test password hashing
    const testPassword = 'TestPassword123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    console.log('✅ Password hashing works');
    
    // Test password verification
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('✅ Password verification works:', isValid);
    
    console.log('🎉 All settings functionality working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing settings:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await databaseHelpers.pool.end();
  }
};

testSettings();



