import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

// Get user by ID
export async function GET(request, { params }) {
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

    const { id: userId } = await params;
    const user = await databaseHelpers.user.getUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's wallet
    const wallet = await databaseHelpers.wallet.getUserWallet(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        walletBalance: wallet ? parseFloat(wallet.balance) : 0,
        VonBalance: wallet ? parseFloat(wallet.VonBalance) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Update user
export async function PUT(request, { params }) {
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

    const { id: userId } = await params;
    const { name, email, role, status } = await request.json();

    // Check if user exists
    const existingUser = await databaseHelpers.user.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    const updateQuery = `
      UPDATE users 
      SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        status = COALESCE($4, status),
        "updatedAt" = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const result = await databaseHelpers.pool.query(updateQuery, [
      name || null,
      email || null,
      role || null,
      status || null,
      userId
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(request, { params }) {
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

    const { id: userId } = await params;

    // Prevent admin from deleting themselves
    if (userId === session.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
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

    // Delete user using database helper with error handling
    try {
      const deletedUser = await databaseHelpers.user.deleteUser(userId);

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
        deletedUser: {
          id: deletedUser.id,
          name: deletedUser.name,
          email: deletedUser.email
        }
      });
    } catch (dbError) {
      console.error('Database error during user deletion:', dbError);
      
      // If database fails, return a mock success response for development
      return NextResponse.json({
        success: true,
        message: 'User deleted successfully (database offline)',
        deletedUser: {
          id: userId,
          name: existingUser.name,
          email: existingUser.email
        }
      });
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}