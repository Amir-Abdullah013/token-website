import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Dynamic import to avoid build-time issues
    const bcrypt = (await import('bcryptjs')).default;
    
    // Try to use database - this should always work now
    let user;
    try {
      console.log('🔍 Starting user creation process for:', email);
      
      // Import database helpers dynamically to avoid import errors
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      // Check if user already exists
      console.log('🔍 Checking if user already exists...');
      const existingUser = await databaseHelpers.user.getUserByEmail(email);
      
      if (existingUser) {
        console.log('❌ User already exists:', email);
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      // Hash password
      console.log('🔐 Hashing password...');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user in database
      console.log('👤 Creating user in database...');
      const userData = {
        email,
        password: hashedPassword,
        name,
        emailVerified: process.env.NODE_ENV === 'development' ? true : false,
        role: 'USER'
      };

      user = await databaseHelpers.user.createUser(userData);
      console.log('✅ User created successfully:', user.email);

      // Create wallet for the user
      console.log('💰 Creating wallet for user...');
      try {
        await databaseHelpers.wallet.createWallet(user.id);
        console.log('✅ Wallet created successfully for user:', user.id);
      } catch (walletError) {
        console.error('❌ Error creating wallet for user:', walletError);
        // Don't fail the signup if wallet creation fails
      }

    } catch (dbError) {
      console.error('❌ Database error during signup:', dbError);
      
      // Return error instead of fallback
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create account. Database connection error.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now sign in.',
      user: {
        ...userWithoutPassword,
        $id: user.id
      }
    });

  } catch (error) {
    console.error('Sign up error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
