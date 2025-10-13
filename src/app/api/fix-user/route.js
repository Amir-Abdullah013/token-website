import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import { databaseHelpers } from '../../../lib/database';

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user already exists
    const existingUser = await databaseHelpers.user.getUserById(session.id);
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists in database',
        user: existingUser
      });
    }

    // Create user in database
    const userData = {
      email: session.email,
      name: session.name || 'User',
      password: 'oauth-user', // Placeholder for OAuth users
      emailVerified: true,
      role: 'USER'
    };

    const newUser = await databaseHelpers.user.createUser(userData);
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully in database',
      user: newUser
    });

  } catch (error) {
    console.error('Error fixing user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create user',
        details: error.message
      },
      { status: 500 }
    );
  }
}
