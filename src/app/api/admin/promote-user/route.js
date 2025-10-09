import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`🔧 Promoting user ${email} to admin...`);
    
    // Find the user using database helper
    const user = await databaseHelpers.user.getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { success: true, message: 'User is already an admin', user },
        { status: 200 }
      );
    }
    
    // Update user role to ADMIN using database helper
    const updatedUser = await databaseHelpers.user.updateUser(user.id, {
      role: 'ADMIN'
    });
    
    console.log(`✅ Successfully promoted ${email} to admin!`);
    
    return NextResponse.json({
      success: true,
      message: 'User promoted to admin successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
    
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to promote user to admin' },
      { status: 500 }
    );
  }
}





