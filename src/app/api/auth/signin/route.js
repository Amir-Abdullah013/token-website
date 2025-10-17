import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Dynamic import to avoid build-time issues
    const bcrypt = (await import('bcryptjs')).default;
    
    // Try to use database, fallback to mock user if database fails
    let user;
    let usedDatabase = false;
    try {
      // Import database helpers dynamically to avoid import errors
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      console.log('🔍 Searching for user with email:', email);
      
      // Find user by email in database
      user = await databaseHelpers.user.getUserByEmail(email);
      usedDatabase = true;
      
      if (user) {
        console.log('✅ User found in database:', user.email, user.name);
      } else {
        console.log('❌ User not found in database for email:', email);
      }
      
    } catch (dbError) {
      console.error('❌ Database error, using fallback authentication:', dbError);
      
      // Fallback: Use mock user for development
      const mockUsers = [
        {
          id: '1',
          email: 'test@example.com',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8.8.8.8', // 'password123'
          name: 'Test User',
          role: 'USER',
          emailVerified: true,
          status: 'active'
        }
      ];

      // Find user by email in mock data
      user = mockUsers.find(u => u.email === email);
      console.log('🔍 Searching in mock users for:', email, user ? 'Found' : 'Not found');
    }
    
    if (!user) {
      console.log('❌ No user found for email:', email);
      console.log('📊 Database used:', usedDatabase);
      
      // Try to get all users to help debug
      try {
        const { databaseHelpers } = await import('../../../../lib/database.js');
        const allUsers = await databaseHelpers.user.getAllUsers();
        console.log('📋 All users in database:', allUsers.map(u => ({ email: u.email, name: u.name })));
      } catch (debugError) {
        console.error('Error fetching all users for debug:', debugError);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `No account found with this email (${email}). Please create an account first.`,
          errorCode: 'USER_NOT_FOUND',
          suggestion: 'Create Account',
          debug: {
            email: email,
            usedDatabase: usedDatabase,
            timestamp: new Date().toISOString(),
            suggestion: 'Check if the email address is correct and try again'
          }
        },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Incorrect password. Please check your password and try again.',
          errorCode: 'INVALID_PASSWORD'
        },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (user.status === 'inactive') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Your account is currently on hold. Please contact support for assistance.',
          errorCode: 'ACCOUNT_DEACTIVATED'
        },
        { status: 403 }
      );
    }

    // Email verification check removed - users can sign in immediately after signup

    // Update last login time (only if we used database)
    if (usedDatabase) {
      try {
        const { databaseHelpers } = await import('../../../../lib/database.js');
        await databaseHelpers.user.updateLastLogin(user.id);
        console.log('✅ Last login updated for user:', user.id);
      } catch (loginUpdateError) {
        console.error('Error updating last login:', loginUpdateError);
        // Don't fail the signin if last login update fails
      }
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      message: 'Sign in successful!',
      user: {
        ...userWithoutPassword,
        $id: user.id
      }
    });

  } catch (error) {
    console.error('Sign in error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to sign in. Please try again.' },
      { status: 500 }
    );
  }
}