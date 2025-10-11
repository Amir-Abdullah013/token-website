import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../../lib/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

    // Find user by email
    const user = await databaseHelpers.user.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Debug: Log user role for troubleshooting
    console.log('🔍 Admin login attempt:', {
      email: user.email,
      role: user.role,
      roleType: typeof user.role,
      roleLength: user.role?.length
    });

    // Check if user has admin role (handle different formats and case variations)
    const userRole = user.role?.toLowerCase?.() || user.role;
    const isAdmin = userRole === 'admin' || userRole === 'administrator' || userRole === 'super_admin' || userRole === 'superadmin' || user.role === 'ADMIN';
    
    if (!isAdmin) {
      console.log('❌ Admin role check failed:', {
        expected: 'admin',
        actual: userRole,
        original: user.role,
        isAdmin: isAdmin
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Access denied: Admin role required. Current role: "${user.role}". Please ensure your account has admin privileges.` 
        },
        { status: 403 }
      );
    }

    console.log('✅ Admin role verified:', userRole);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token with admin role
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      message: 'Admin login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      // Include session data for localStorage
      session: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // Set secure HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    // Also set a regular session cookie for compatibility
    response.cookies.set('session', JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
