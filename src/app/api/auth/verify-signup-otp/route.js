import { NextResponse } from 'next/server';

/**
 * Verify Signup OTP API
 * 
 * This endpoint verifies the OTP and completes the signup process:
 * 1. User provides email, OTP, and signup data (name, password, referralCode)
 * 2. System verifies OTP is correct and not expired
 * 3. System creates user account and completes signup
 */

export async function POST(request) {
  try {
    const { email, otp, name, password, referralCode } = await request.json();

    // Validate input
    if (!email || !otp || !name || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, OTP, name, and password are required' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const { verifyOTP } = await import('../../../../lib/otp-utils-simple.js');
      const bcrypt = (await import('bcryptjs')).default;

      // Check if user already exists (in case of race condition)
      const existingUser = await databaseHelpers.user.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'User with this email already exists' },
          { status: 409 }
        );
      }

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

      // OTP is valid - now create the user account
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Handle referral code validation
      let referrerId = null;
      if (referralCode) {
        const referrer = await databaseHelpers.user.getUserById(referralCode);
        
        if (!referrer) {
          // Clean up OTP before returning error
          await databaseHelpers.passwordReset.deletePasswordReset(otpRecord.id);
          return NextResponse.json(
            { success: false, error: 'Invalid referral code' },
            { status: 400 }
          );
        }
        
        referrerId = referrer.id;
      }

      // Create user in database
      const userData = {
        email,
        password: hashedPassword,
        name,
        emailVerified: true,
        role: 'USER',
        referrerId
      };

      const user = await databaseHelpers.user.createUser(userData);
      console.log('✅ User created successfully:', user.email);

      // Set referralCode for the new user (use their ID as referral code)
      try {
        await databaseHelpers.pool.query(`
          UPDATE users 
          SET "referralCode" = $1, "updatedAt" = NOW()
          WHERE id = $1 AND ("referralCode" IS NULL OR "referralCode" = '')
        `, [user.id]);
        console.log('✅ Referral code set for new user:', user.id);
      } catch (refCodeError) {
        console.error('❌ Error setting referral code:', refCodeError);
        // Don't fail signup if referral code setting fails
      }

      // Clean up the used OTP
      await databaseHelpers.passwordReset.deletePasswordReset(otpRecord.id);
      console.log('✅ OTP cleaned up after successful verification');

      // Create referral record if referral code was provided
      let referralRecord = null;
      if (referrerId) {
        try {
          referralRecord = await databaseHelpers.referral.createReferral({
            referrerId,
            referredId: user.id
          });
          console.log('✅ Referral record created successfully:', referralRecord.id);
          
          // Set hasReferredOne = true for the referrer
          await databaseHelpers.pool.query(`
            UPDATE users 
            SET "hasReferredOne" = true, "updatedAt" = NOW()
            WHERE id = $1
          `, [referrerId]);
          console.log('✅ Set hasReferredOne = true for referrer:', referrerId);
        } catch (referralError) {
          console.error('❌ Error creating referral record:', referralError);
          // Don't fail the signup if referral creation fails
        }
      }

      // Create wallet for the user
      try {
        await databaseHelpers.wallet.createWallet(user.id);
        console.log('✅ Wallet created successfully for user:', user.id);
      } catch (walletError) {
        console.error('❌ Error creating wallet for user:', walletError);
        // Don't fail the signup if wallet creation fails
      }

      // Schedule wallet fee (30-day free trial)
      try {
        const walletFeeService = (await import('../../../../lib/walletFeeService.js')).default;
        await walletFeeService.scheduleWalletFee(user);
        console.log('✅ Wallet fee scheduled successfully for user:', user.id);
      } catch (feeError) {
        console.error('❌ Error scheduling wallet fee:', feeError);
        // Don't fail the signup if fee scheduling fails
      }

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      
      // Prepare response data
      const responseData = {
        success: true,
        message: 'Account created successfully! You can now sign in.',
        user: {
          ...userWithoutPassword,
          $id: user.id
        }
      };

      // Add referral information if applicable
      if (referralRecord) {
        responseData.referrerId = referrerId;
        responseData.referralId = referralRecord.id;
      }
      
      return NextResponse.json(responseData);

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
