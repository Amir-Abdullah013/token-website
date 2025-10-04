import { NextResponse } from 'next/server';

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

    // Dynamic imports to avoid build-time issues
    const { databaseHelpers } = await import('../../../../lib/database.js');
    const { verifyOTP, isOTPExpired, isValidOTP } = await import('../../../../lib/otp-utils-simple.js');

    // Validate OTP format
    if (!isValidOTP(otp)) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP format. OTP must be 6 digits.' },
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

    console.log(`OTP verification successful for user: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      resetId: passwordReset.id
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    
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
      { success: false, error: 'Failed to verify OTP. Please try again.' },
      { status: 500 }
    );
  }
}
