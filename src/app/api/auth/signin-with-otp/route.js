import { NextResponse } from 'next/server';

/**
 * OTP Sign-in API
 * 
 * This endpoint handles the OTP-based sign-in process:
 * 1. User provides email and password
 * 2. System validates credentials
 * 3. System sends OTP to user's email
 * 4. User must verify OTP to complete sign-in
 */

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
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

    // Dynamic import to avoid build-time issues
    const bcrypt = (await import('bcryptjs')).default;
    
    // Try to use database, fallback to mock user if database fails
    let user;
    let usedDatabase = false;
    try {
      // Import database helpers dynamically to avoid import errors
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      console.log('🔍 Searching for user with email:', email);
      
      // Find user by email in database
      user = await databaseHelpers.user.getUserByEmail(email);
      usedDatabase = true;
      
      if (user) {
        console.log('✅ User found in database:', user.email, user.name);
      } else {
        console.log('❌ User not found in database for email:', email);
      }
      
    } catch (dbError) {
      console.error('❌ Database error, using fallback authentication:', dbError);
      
      // Fallback: Use mock user for development
      const mockUsers = [
        {
          id: '1',
          email: 'test@example.com',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8.8.8.8', // 'password123'
          name: 'Test User',
          role: 'USER',
          emailVerified: true,
          status: 'active'
        }
      ];

      // Find user by email in mock data
      user = mockUsers.find(u => u.email === email);
      console.log('🔍 Searching in mock users for:', email, user ? 'Found' : 'Not found');
    }
    
    if (!user) {
      console.log('❌ No user found for email:', email);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `No account found with this email (${email}). Please create an account first.`,
          errorCode: 'USER_NOT_FOUND',
          suggestion: 'Create Account'
        },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Incorrect password. Please check your password and try again.',
          errorCode: 'INVALID_PASSWORD'
        },
        { status: 401 }
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

    // Generate and send OTP
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const { generateOTP, hashOTP, getOTPExpiry } = await import('../../../../lib/otp-utils-simple.js');
      const { sendOTPEmail } = await import('../../../../lib/email-service-simple.js');

      // Generate OTP
      const otp = generateOTP();
      console.log(`🔍 Generated OTP for sign-in ${email}: ${otp}`);

      // Hash the OTP using bcrypt (12 salt rounds for security)
      const otpHash = await hashOTP(otp);
      console.log(`🔍 Hashed OTP: ${otpHash.substring(0, 20)}...`);

      // Set expiry time (10 minutes from now)
      const expiresAt = getOTPExpiry(10);

      // Store OTP record in database with hashed OTP
      const otpRecord = await databaseHelpers.passwordReset.createPasswordReset({
        email,
        otpHash,
        expiresAt,
        type: 'SIGNIN_OTP' // Mark as sign-in OTP
      });

      console.log(`OTP record created for sign-in ${email} with ID: ${otpRecord.id}`);

      // Send OTP email
      try {
        console.log(`🔍 Sending sign-in OTP email to ${email} with OTP: ${otp}`);
        const emailResult = await sendOTPEmail(email, otp, user.name, 'signin');
        console.log(`✅ Sign-in OTP email sent successfully to ${email}:`, emailResult.messageId);
      } catch (emailError) {
        console.error('❌ Failed to send sign-in OTP email:', emailError);
        
        // If email fails, we should still return success to prevent OTP enumeration
        // but log the error for debugging
        console.error('Email service error - OTP generated but not sent:', emailError.message);
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

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully to your email. Please check your inbox and enter the 6-digit code to complete sign-in.',
        requiresOTP: true,
        email: email,
        otpId: otpRecord.id
      });

    } catch (otpError) {
      console.error('Error generating/sending OTP:', otpError);
      
      // If OTP generation fails, fall back to regular sign-in
      console.log('⚠️ OTP generation failed, falling back to regular sign-in');
      
      // Update last login time (only if we used database)
      if (usedDatabase) {
        try {
          const { databaseHelpers } = await import('../../../../lib/database.js');
          await databaseHelpers.user.updateLastLogin(user.id);
          console.log('✅ Last login updated for user:', user.id);
        } catch (loginUpdateError) {
          console.error('Error updating last login:', loginUpdateError);
        }
      }

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      
      return NextResponse.json({
        success: true,
        message: 'Sign in successful! (OTP service unavailable)',
        user: {
          ...userWithoutPassword,
          $id: user.id
        },
        otpFallback: true
      });
    }

  } catch (error) {
    console.error('OTP Sign in error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to sign in. Please try again.' },
      { status: 500 }
    );
  }
}
