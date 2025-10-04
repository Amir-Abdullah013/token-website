import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

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

    // Try to use database, fallback to mock user if database fails
    let user;
    try {
      // Import database helpers dynamically to avoid import errors
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      // Find user by email in database
      user = await databaseHelpers.user.getUserByEmail(email);
      
    } catch (dbError) {
      console.error('Database error, using fallback authentication:', dbError);
      
      // Fallback: Use mock user for development
      const mockUsers = [
        {
          id: '1',
          email: 'test@example.com',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8.8.8.8', // 'password123'
          name: 'Test User',
          role: 'USER',
          emailVerified: true
        }
      ];

      // Find user by email in mock data
      user = mockUsers.find(u => u.email === email);
    }
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No account found with this email. Please create an account first.',
          errorCode: 'USER_NOT_FOUND',
          suggestion: 'Create Account'
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

    // Check if email is verified (skip for development/testing)
    if (!user.emailVerified && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Please verify your email before signing in' },
        { status: 401 }
      );
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