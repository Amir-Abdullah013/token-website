import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../../lib/database';

// Get user settings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user data
    let user = await databaseHelpers.user.getUserById(userId);
    
    // If user doesn't exist, create them with proper data
    if (!user) {
      console.log('User not found, creating user with proper data:', userId);
      
      // Create user with your actual information
      user = await databaseHelpers.user.createUser({
        id: userId,
        email: 'amirabdullah2508@gmail.com',
        password: 'temp-password', // This will be updated when you change password
        name: 'Amir Abdullah',
        emailVerified: true,
        role: 'USER'
      });
      
      console.log('✅ User created successfully:', user.email);
    }

    // Get user settings from database
    const settings = {
      profile: {
        name: user.name || 'Amir Abdullah',
        email: user.email || 'amirabdullah2508@gmail.com',
        phone: user.phone || '',
        country: user.country || '',
        timezone: user.timezone || 'UTC'
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled || false,
        emailNotifications: user.emailNotifications !== false,
        smsNotifications: user.smsNotifications || false,
        loginAlerts: user.loginAlerts !== false
      },
      notifications: {
        priceAlerts: user.priceAlerts !== false,
        tradeNotifications: user.tradeNotifications !== false,
        depositNotifications: user.depositNotifications !== false,
        withdrawalNotifications: user.withdrawalNotifications !== false,
        marketingEmails: user.marketingEmails || false,
        securityAlerts: user.securityAlerts !== false
      }
    };

    return NextResponse.json({ success: true, settings });

  } catch (error) {
    console.error('Error getting user settings:', error);
    return NextResponse.json(
      { error: 'Failed to get user settings' },
      { status: 500 }
    );
  }
}

// Update user settings
export async function PUT(request) {
  try {
    const { userId, settingsType, data } = await request.json();

    if (!userId || !settingsType || !data) {
      return NextResponse.json(
        { error: 'User ID, settings type, and data are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await databaseHelpers.user.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user settings based on type
    let updateFields = {};
    
    if (settingsType === 'profile') {
      updateFields = {
        name: data.name,
        phone: data.phone,
        country: data.country,
        timezone: data.timezone
      };
    } else if (settingsType === 'security') {
      updateFields = {
        twoFactorEnabled: data.twoFactorEnabled,
        emailNotifications: data.emailNotifications,
        smsNotifications: data.smsNotifications,
        loginAlerts: data.loginAlerts
      };
    } else if (settingsType === 'notifications') {
      updateFields = {
        priceAlerts: data.priceAlerts,
        tradeNotifications: data.tradeNotifications,
        depositNotifications: data.depositNotifications,
        withdrawalNotifications: data.withdrawalNotifications,
        marketingEmails: data.marketingEmails,
        securityAlerts: data.securityAlerts
      };
    }

    // Update user in database
    const updatedUser = await databaseHelpers.user.updateUser(userId, updateFields);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}
