import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Import database helpers with error handling for Vercel compatibility
let databaseHelpers;
const loadDatabaseHelpers = async () => {
  if (databaseHelpers) return databaseHelpers;
  
  try {
    const dbModule = await import('../../../../lib/database.js');
    databaseHelpers = dbModule.databaseHelpers;
    return databaseHelpers;
  } catch (error) {
    console.warn('Database helpers not available:', error.message);
    return null;
  }
};

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

    // Load database helpers dynamically
    const dbHelpers = await loadDatabaseHelpers();
    if (!dbHelpers) {
      return NextResponse.json(
        { success: false, error: 'Database not available. Please try again later.' },
        { status: 503 }
      );
    }

    // Check if user exists
    const user = await dbHelpers.user.getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is verified (if email verification is required)
    if (user.emailVerified === false) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email before signing in' },
        { status: 401 }
      );
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        $id: user.id, // Use $id for compatibility
        role: user.role || 'user'
      }
    });

  } catch (error) {
    console.error('Sign in error:', error);
    
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
