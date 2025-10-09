import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Import database helpers dynamically to avoid import errors
    const { databaseHelpers } = await import('../../../../lib/database.js');
    
    // Get all users from database
    const users = await databaseHelpers.user.getAllUsers();
    
    // Return user list (without passwords)
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    }));
    
    return NextResponse.json({
      success: true,
      count: safeUsers.length,
      users: safeUsers
    });
    
  } catch (error) {
    console.error('Debug users error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: error.message 
      },
      { status: 500 }
    );
  }
}


