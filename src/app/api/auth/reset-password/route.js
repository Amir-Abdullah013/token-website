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

    // Dynamic imports to avoid build-time issues (import early to use functions)
    const bcrypt = (await import('bcryptjs')).default;
    const { databaseHelpers } = await import('../../../../lib/database.js');
    const { verifyOTP, isOTPExpired, isValidOTP } = await import('../../../../lib/otp-utils-simple.js');

    // Validate OTP format (after import)
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

    // Check if user exists
    const user = await databaseHelpers.user.getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email not registered' },
        { status: 400 }
      );
    }

    // Get the most recent unused password reset record for this email
    const passwordReset = await databaseHelpers.passwordReset.getPasswordResetByEmail(email);
    
    if (!passwordReset) {
      return NextResponse.json(
        { success: false, error: 'No valid OTP found for this email. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired (10 minutes default)
    if (isOTPExpired(passwordReset.expiresAt)) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP using bcrypt comparison (secure verification)
    const isOtpValid = await verifyOTP(otp, passwordReset.otpHash);
    
    if (!isOtpValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP. Please check and try again.' },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity (password update + mark OTP as used)
    let client;
    try {
      client = await databaseHelpers.pool.connect();
      await client.query('BEGIN');

      // Hash the new password with bcrypt (12 salt rounds for security)
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password
      const updatedUser = await databaseHelpers.user.updatePassword(user.id, hashedPassword);

      // Mark password reset as used (one-time use security measure)
      await databaseHelpers.passwordReset.markPasswordResetAsUsed(passwordReset.id);

      await client.query('COMMIT');
      
      console.log(`✅ Password reset successful for user: ${email}`);
      
      return NextResponse.json({
        success: true,
        message: 'Password reset successfully. You can now sign in with your new password.'
      });

    } catch (transactionError) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error('Transaction error during password reset:', transactionError);
      throw transactionError;
    } finally {
      if (client) {
        client.release();
      }
    }

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
