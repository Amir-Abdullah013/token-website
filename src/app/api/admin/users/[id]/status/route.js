import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../../../lib/session';
import { databaseHelpers } from '../../../../../../lib/database';

// Update user status
export async function PATCH(request, { params }) {
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

    const userId = params.id;
    const { status } = await request.json();

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be "active" or "inactive"' },
        { status: 400 }
      );
    }

    // Prevent admin from deactivating themselves
    if (userId === session.id && status === 'inactive') {
      return NextResponse.json(
        { success: false, error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await databaseHelpers.user.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user status using database helper
    const updatedUser = await databaseHelpers.user.updateUserStatus(userId, status);

    console.log('✅ User status updated successfully:', {
      userId,
      status,
      updatedUser: updatedUser ? 'success' : 'failed'
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
