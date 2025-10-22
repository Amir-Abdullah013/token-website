import { NextResponse } from 'next/server';

/**
 * Verify Sign-in OTP API
 * 
 * This endpoint verifies the OTP and completes the sign-in process:
 * 1. User provides email and OTP
 * 2. System verifies OTP is correct and not expired
 * 3. System completes sign-in and returns user data
 */

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
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

    // Validate OTP format (6 digits)
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 6-digit OTP' },
        { status: 400 }
      );
    }

    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const { verifyOTP } = await import('../../../../lib/otp-utils-simple.js');

      // Find the most recent OTP record for this email
      const otpRecord = await databaseHelpers.passwordReset.getLatestOTPByEmail(email);
      
      if (!otpRecord) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'No OTP found for this email. Please request a new OTP.',
            errorCode: 'OTP_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Check if OTP is expired
      const now = new Date();
      if (new Date(otpRecord.expiresAt) < now) {
        // Clean up expired OTP
        await databaseHelpers.passwordReset.deletePasswordReset(otpRecord.id);
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'OTP has expired. Please request a new OTP.',
            errorCode: 'OTP_EXPIRED'
          },
          { status: 400 }
        );
      }

      // Verify OTP
      const isOTPValid = await verifyOTP(otp, otpRecord.otpHash);
      
      if (!isOTPValid) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid OTP. Please check the code and try again.',
            errorCode: 'INVALID_OTP'
          },
          { status: 401 }
        );
      }

      // OTP is valid, get user data
      const user = await databaseHelpers.user.getUserByEmail(email);
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User not found. Please try signing in again.',
            errorCode: 'USER_NOT_FOUND'
          },
          { status: 404 }
        );
      }

      // Check if user account is active
      if (user.status === 'inactive') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Your account is currently on hold. Please contact support for assistance.',
            errorCode: 'ACCOUNT_DEACTIVATED'
          },
          { status: 403 }
        );
      }

      // Update last login time
      try {
        await databaseHelpers.user.updateLastLogin(user.id);
        console.log('✅ Last login updated for user:', user.id);
      } catch (loginUpdateError) {
        console.error('Error updating last login:', loginUpdateError);
        // Don't fail the signin if last login update fails
      }

      // Clean up the used OTP
      await databaseHelpers.passwordReset.deletePasswordReset(otpRecord.id);
      console.log('✅ OTP cleaned up after successful verification');

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

    } catch (dbError) {
      console.error('Database error during OTP verification:', dbError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error. Please try again.',
          errorCode: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    );
  }
}
