import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
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
    const { generateOTP, hashOTP, getOTPExpiry } = await import('../../../../lib/otp-utils-simple.js');
    const { sendOTPEmail } = await import('../../../../lib/email-service-simple.js');

    // Check if user exists
    // Security Note: In production, you may want to return a generic message
    // to prevent user enumeration attacks. For now, we return specific errors for better UX.
    const user = await databaseHelpers.user.getUserByEmail(email);
    
    if (!user) {
      // Generic response to prevent user enumeration (optional - currently showing specific error)
      return NextResponse.json(
        { success: false, error: 'Email not registered' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    console.log(`🔍 Generated OTP for ${email}: ${otp}`);
    console.log(`🔍 OTP type: ${typeof otp}, length: ${otp.length}`);

    // Hash the OTP using bcrypt (12 salt rounds for security)
    const otpHash = await hashOTP(otp);
    console.log(`🔍 Hashed OTP: ${otpHash.substring(0, 20)}...`);

    // Set expiry time (10 minutes from now)
    const expiresAt = getOTPExpiry(10);

    // Store password reset record in database with hashed OTP
    // Security: OTP is hashed before storage to prevent exposure if database is compromised
    const passwordReset = await databaseHelpers.passwordReset.createPasswordReset({
      email,
      otpHash,
      expiresAt
    });

    console.log(`Password reset record created for ${email} with ID: ${passwordReset.id}`);

    // Send OTP email
    try {
      console.log(`🔍 Sending OTP email to ${email} with OTP: ${otp}`);
      const emailResult = await sendOTPEmail(email, otp, user.name);
      console.log(`✅ OTP email sent successfully to ${email}:`, emailResult.messageId);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      
      // If email fails, we should still return success to prevent OTP enumeration
      // but log the error for debugging
      console.error('Email service error - OTP generated but not sent:', emailError.message);
    }

    // Clean up expired password resets (run in background)
    databaseHelpers.passwordReset.cleanupExpiredResets()
      .then(result => {
        if (result.count > 0) {
          console.log(`Cleaned up ${result.count} expired password resets`);
        }
      })
      .catch(error => {
        console.error('Error cleaning up expired password resets:', error);
      });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Handle specific database connection errors
    if (error.message.includes('Can\'t reach database server') || 
        error.message.includes('Connection refused') ||
        error.message.includes('timeout')) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }

    // Handle email service errors
    if (error.message.includes('Email service not configured') ||
        error.message.includes('Failed to send email')) {
      return NextResponse.json(
        { success: false, error: 'Email service is currently unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to process forgot password request. Please try again.' },
      { status: 500 }
    );
  }
}
