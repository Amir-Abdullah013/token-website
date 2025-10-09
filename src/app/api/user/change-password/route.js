import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    // Validate input
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'User ID, current password, and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'New password must be at least 8 characters long',
          fieldErrors: { newPassword: 'Password must be at least 8 characters long' }
        },
        { status: 400 }
      );
    }

    // Check password complexity
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          fieldErrors: { newPassword: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
        },
        { status: 400 }
      );
    }

    // Dynamic import to avoid build-time issues
    const bcrypt = (await import('bcryptjs')).default;
    
    try {
      // Import database helpers dynamically to avoid import errors
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      // Get user from database
      const user = await databaseHelpers.user.getUserById(userId);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Current password is incorrect',
            fieldErrors: { currentPassword: 'Current password is incorrect' }
          },
          { status: 401 }
        );
      }

      // Check if new password is different from current
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'New password must be different from current password',
            fieldErrors: { newPassword: 'New password must be different from current password' }
          },
          { status: 400 }
        );
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password in database
      await databaseHelpers.user.updateUser(userId, { password: hashedNewPassword });

      console.log('✅ Password updated successfully for user:', user.email);

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully!'
      });

    } catch (dbError) {
      console.error('Database error during password change:', dbError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Password change error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to change password. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


