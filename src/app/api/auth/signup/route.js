import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password, name, referralCode } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Dynamic import to avoid build-time issues
    const bcrypt = (await import('bcryptjs')).default;
    
    try {
      console.log('🔍 Starting signup OTP process for:', email);
      
      // Import database helpers dynamically to avoid import errors
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      // Check if user already exists
      console.log('🔍 Checking if user already exists...');
      const existingUser = await databaseHelpers.user.getUserByEmail(email);
      
      if (existingUser) {
        console.log('❌ User already exists:', email);
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      // Validate referral code if provided (but don't create user yet)
      let referrerId = null;
      if (referralCode) {
        console.log('🔍 Validating referral code:', referralCode);
        const referrer = await databaseHelpers.user.getUserById(referralCode);
        
        if (!referrer) {
          console.log('❌ Referral code not found in database');
          return NextResponse.json(
            { success: false, error: 'Invalid referral code' },
            { status: 400 }
          );
        }
        
        referrerId = referrer.id;
        console.log('✅ Valid referral code found for user:', referrer.email);
      }

      // Generate and send OTP
      try {
        const { generateOTP, hashOTP, getOTPExpiry } = await import('../../../../lib/otp-utils-simple.js');
        const { sendOTPEmail } = await import('../../../../lib/email-service-simple.js');

        // Generate OTP
        const otp = generateOTP();
        console.log(`🔍 Generated OTP for signup ${email}: ${otp}`);

        // Hash the OTP using bcrypt (12 salt rounds for security)
        const otpHash = await hashOTP(otp);
        console.log(`🔍 Hashed OTP: ${otpHash.substring(0, 20)}...`);

        // Set expiry time (10 minutes from now)
        const expiresAt = getOTPExpiry(10);

        // Store OTP record in database with hashed OTP
        const otpRecord = await databaseHelpers.passwordReset.createPasswordReset({
          email,
          otpHash,
          expiresAt
        });

        console.log(`OTP record created for signup ${email} with ID: ${otpRecord.id}`);

        // Send OTP email
        try {
          console.log(`🔍 Sending signup OTP email to ${email} with OTP: ${otp}`);
          const emailResult = await sendOTPEmail(email, otp, name, 'signup');
          console.log(`✅ Signup OTP email sent successfully to ${email}:`, emailResult.messageId);
        } catch (emailError) {
          console.error('❌ Failed to send signup OTP email:', emailError);
          
          // In development mode, log OTP to console so testing can continue
          if (process.env.NODE_ENV === 'development') {
            console.log('\n========================================');
            console.log('🚨 EMAIL SERVICE FAILED - DEVELOPMENT MODE');
            console.log('========================================');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 OTP Code: ${otp}`);
            console.log(`⏰ Expires in: 10 minutes`);
            console.log('========================================');
            console.log('⚠️  This OTP is logged because email service is not configured.');
            console.log('⚠️  In production, configure SMTP credentials properly.');
            console.log('========================================\n');
          }
        }

        // Clean up expired OTPs (run in background)
        databaseHelpers.passwordReset.cleanupExpiredResets()
          .then(result => {
            if (result.count > 0) {
              console.log(`Cleaned up ${result.count} expired OTPs`);
            }
          })
          .catch(error => {
            console.error('Error cleaning up expired OTPs:', error);
          });

        // Return success - signup data will be sent from frontend during OTP verification
        return NextResponse.json({
          success: true,
          message: 'OTP sent successfully to your email. Please check your inbox and enter the 6-digit code to complete registration.',
          requiresOTP: true,
          email: email
        });

      } catch (otpError) {
        console.error('Error generating/sending OTP:', otpError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to send verification code. Please try again.',
            details: process.env.NODE_ENV === 'development' ? otpError.message : undefined
          },
          { status: 500 }
        );
      }

    } catch (dbError) {
      console.error('❌ Database error during signup:', dbError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to process signup. Database connection error.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Sign up error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create account. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
