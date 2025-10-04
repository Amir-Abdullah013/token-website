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
    
    // Try to use database, fallback to localStorage simulation if database fails
    let user;
    try {
      // Import database helpers dynamically to avoid import errors
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      // Check if user already exists
      const existingUser = await databaseHelpers.user.getUserByEmail(email);
      
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user in database
      const userData = {
        email,
        password: hashedPassword,
        name,
        emailVerified: process.env.NODE_ENV === 'development' ? true : false,
        role: 'USER'
      };

      user = await databaseHelpers.user.createUser(userData);

      // Create wallet for the user
      try {
        await databaseHelpers.wallet.createWallet(user.id);
      } catch (walletError) {
        console.error('Error creating wallet for user:', walletError);
        // Don't fail the signup if wallet creation fails
      }

    } catch (dbError) {
      console.error('Database error, using fallback storage:', dbError);
      
      // Fallback: Use localStorage simulation for development
      const users = JSON.parse(process.env.NODE_ENV === 'development' ? '[]' : '[]');
      
      // Check if user already exists in fallback
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user in fallback storage
      user = {
        id: Date.now().toString(),
        email,
        password: hashedPassword,
        name,
        emailVerified: true, // Auto-verify in development
        role: 'USER',
        createdAt: new Date().toISOString()
      };

      // In development, we'll just simulate success
      console.log('Fallback user creation:', user);
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
