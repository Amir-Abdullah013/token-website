import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';

export async function GET(request) {
  try {
    const session = await getServerSession();
    
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user details from database
    const { databaseHelpers } = await import('../../../../lib/database.js');
    const user = await databaseHelpers.user.getUserById(session.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('User status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user status' },
      { status: 500 }
    );
  }
}


