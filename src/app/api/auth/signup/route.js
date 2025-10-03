import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Import database helpers with error handling
let databaseHelpers;
try {
  databaseHelpers = require('../../../../lib/database.js').databaseHelpers;
} catch (error) {
  console.warn('Database helpers not available:', error.message);
  databaseHelpers = null;
}

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

    // Check if database is available
    if (!databaseHelpers) {
      return NextResponse.json(
        { success: false, error: 'Database not available. Please try again later.' },
        { status: 503 }
      );
    }

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

    // Create user
    const userData = {
      email,
      password: hashedPassword,
      name,
      emailVerified: false, // Will be verified via email
      role: 'USER'
    };

    const user = await databaseHelpers.user.createUser(userData);

    // Create wallet for the user
    try {
      await databaseHelpers.wallet.createWallet(user.id);
    } catch (walletError) {
      console.error('Error creating wallet for user:', walletError);
      // Don't fail the signup if wallet creation fails
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        ...userWithoutPassword,
        $id: user.id, // Use $id for compatibility
        role: user.role || 'user'
      }
    });

  } catch (error) {
    console.error('Sign up error:', error);
    
    // Handle specific database connection errors
    if (error.message.includes('Can\'t reach database server') || 
        error.message.includes('Connection refused') ||
        error.message.includes('timeout')) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
