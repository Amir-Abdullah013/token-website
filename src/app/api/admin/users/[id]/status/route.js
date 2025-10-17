import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../../../lib/session';
import { databaseHelpers } from '../../../../../../lib/database';

// Update user status
export async function PATCH(request, { params }) {
  console.log('🚀 API endpoint reached: /api/admin/users/[id]/status');
  
  try {
    const session = await getServerSession();
    console.log('🔐 Session check:', { 
      hasSession: !!session, 
      hasId: !!session?.id 
    });
    
    if (!session?.id) {
      console.log('❌ No session or session.id found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    console.log('👤 User role check:', { userRole, isAdmin: userRole === 'ADMIN' });
    
    if (userRole !== 'ADMIN') {
      console.log('❌ User is not admin:', userRole);
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    console.log('📝 Status update request:', { userId, sessionId: session.id });
    
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('📝 Request body:', requestBody);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { status } = requestBody;

    if (!status || !['active', 'inactive'].includes(status)) {
      console.error('❌ Invalid status:', { status, validStatuses: ['active', 'inactive'] });
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
    console.log('🔄 Attempting to update user status:', { userId, status });
    
    const updatedUser = await databaseHelpers.user.updateUserStatus(userId, status);
    
    if (!updatedUser) {
      console.error('❌ Database update failed - no user returned');
      return NextResponse.json(
        { success: false, error: 'Failed to update user status in database' },
        { status: 500 }
      );
    }

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
    console.error('❌ Error updating user status:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      userId: userId,
      status: status
    });
    
    // Return a proper error response
    const errorResponse = {
      success: false,
      error: 'Failed to update user status',
      details: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ Returning error response:', errorResponse);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
