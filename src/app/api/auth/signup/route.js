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
    
    // Try to use database - this should always work now
    let user;
    try {
      console.log('🔍 Starting user creation process for:', email);
      
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

      // Hash password
      console.log('🔐 Hashing password...');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Handle referral code validation
      let referrerId = null;
      if (referralCode) {
        console.log('🔍 Validating referral code:', referralCode);
        console.log('🔍 Referral code type:', typeof referralCode);
        console.log('🔍 Referral code length:', referralCode.length);
        
        const referrer = await databaseHelpers.user.getUserById(referralCode);
        console.log('🔍 Referrer lookup result:', referrer ? 'Found' : 'Not found');
        
        if (!referrer) {
          console.log('❌ Referral code not found in database');
          return NextResponse.json(
            { success: false, error: 'Invalid referral code' },
            { status: 400 }
          );
        }
        
        referrerId = referrer.id;
        console.log('✅ Valid referral code found for user:', referrer.email);
      } else {
        console.log('ℹ️ No referral code provided');
      }

      // Create user in database
      console.log('👤 Creating user in database...');
      const userData = {
        email,
        password: hashedPassword,
        name,
        emailVerified: true,
        role: 'USER',
        referrerId
      };

      user = await databaseHelpers.user.createUser(userData);
      console.log('✅ User created successfully:', user.email);

      // Create referral record if referral code was provided
      let referralRecord = null;
      if (referrerId) {
        try {
          console.log('🔗 Creating referral record...');
          console.log('🔗 Referrer ID:', referrerId);
          console.log('🔗 Referred ID:', user.id);
          
          referralRecord = await databaseHelpers.referral.createReferral({
            referrerId,
            referredId: user.id
          });
          console.log('✅ Referral record created successfully:', referralRecord.id);

        } catch (referralError) {
          console.error('❌ Error creating referral record:', referralError);
          console.error('❌ Referral error details:', {
            message: referralError.message,
            code: referralError.code,
            detail: referralError.detail
          });
          // Don't fail the signup if referral creation fails
        }
      }

      // Create wallet for the user
      console.log('💰 Creating wallet for user...');
      try {
        await databaseHelpers.wallet.createWallet(user.id);
        console.log('✅ Wallet created successfully for user:', user.id);
      } catch (walletError) {
        console.error('❌ Error creating wallet for user:', walletError);
        // Don't fail the signup if wallet creation fails
      }

      // Schedule wallet fee (30-day free trial)
      console.log('📅 Scheduling wallet fee for user...');
      try {
        const walletFeeService = (await import('../../../../lib/walletFeeService.js')).default;
        await walletFeeService.scheduleWalletFee(user);
        console.log('✅ Wallet fee scheduled successfully for user:', user.id);
      } catch (feeError) {
        console.error('❌ Error scheduling wallet fee:', feeError);
        // Don't fail the signup if fee scheduling fails
      }

    } catch (dbError) {
      console.error('❌ Database error during signup:', dbError);
      
      // If user was created but other operations failed, still return success
      if (user && user.id) {
        console.log('✅ User was created successfully, returning success despite other errors');
        const { password: _, ...userWithoutPassword } = user;
        
        return NextResponse.json({
          success: true,
          userId: user.id,
          message: 'Account created successfully! You can now sign in.',
          user: {
            ...userWithoutPassword,
            $id: user.id
          }
        });
      }
      
      // Return error only if user creation failed
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create account. Database connection error.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

    // Return user data (without password)
    try {
      const { password: _, ...userWithoutPassword } = user;
      
      // Prepare response data
      const responseData = {
        success: true,
        userId: user.id,
        message: referralRecord ? 'Signup successful with referral' : 'Account created successfully! You can now sign in.',
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
      
      console.log('✅ Returning success response for user:', user.email);
      return NextResponse.json(responseData);
      
    } catch (responseError) {
      console.error('❌ Error preparing response:', responseError);
      
      // Return basic success response even if response preparation fails
      return NextResponse.json({
        success: true,
        userId: user.id,
        message: 'Account created successfully! You can now sign in.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          $id: user.id
        }
      });
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
