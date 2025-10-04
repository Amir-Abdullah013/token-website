import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, otp, newPassword } = await request.json();

    // Validate input
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, OTP, and new password are required' },
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

    // Validate OTP format
    if (!isValidOTP(otp)) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP format. OTP must be 6 digits.' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Dynamic imports to avoid build-time issues
    const bcrypt = (await import('bcryptjs')).default;
    const { databaseHelpers } = await import('../../../../lib/database.js');
    const { verifyOTP, isOTPExpired, isValidOTP } = await import('../../../../lib/otp-utils-simple.js');

    // Check if user exists
    const user = await databaseHelpers.user.getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email not registered' },
        { status: 400 }
      );
    }

    // Get the most recent password reset record for this email
    const passwordReset = await databaseHelpers.passwordReset.getPasswordResetByEmail(email);
    
    if (!passwordReset) {
      return NextResponse.json(
        { success: false, error: 'No valid OTP found for this email. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (isOTPExpired(passwordReset.expiry)) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isOtpValid = await verifyOTP(otp, passwordReset.hashedOtp);
    
    if (!isOtpValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP. Please check and try again.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    const updatedUser = await databaseHelpers.user.updatePassword(user.id, hashedPassword);

    // Mark password reset as used
    await databaseHelpers.passwordReset.markPasswordResetAsUsed(passwordReset.id);

    console.log(`Password reset successful for user: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    
    // Handle specific database connection errors
    if (error.message.includes('Can\'t reach database server') || 
        error.message.includes('Connection refused') ||
        error.message.includes('timeout')) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
