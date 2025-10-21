import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }
    
    console.log('🔍 Testing forgot password flow for:', email);
    
    // Import all required modules
    const { databaseHelpers } = await import('../../../../lib/database.js');
    const { generateOTP, hashOTP, verifyOTP } = await import('../../../../lib/otp-utils-simple.js');
    const { sendOTPEmail } = await import('../../../../lib/email-service-simple.js');
    
    // Step 1: Generate OTP
    const otp = generateOTP();
    console.log(`🔍 Step 1 - Generated OTP: ${otp}`);
    
    // Step 2: Hash OTP
    const otpHash = await hashOTP(otp);
    console.log(`🔍 Step 2 - Hashed OTP: ${otpHash.substring(0, 20)}...`);
    
    // Step 3: Store in database
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const passwordReset = await databaseHelpers.passwordReset.createPasswordReset({
      email,
      otpHash,
      expiresAt
    });
    console.log(`🔍 Step 3 - Stored in database with ID: ${passwordReset.id}`);
    
    // Step 4: Retrieve from database
    const retrievedReset = await databaseHelpers.passwordReset.getPasswordResetByEmail(email);
    console.log(`🔍 Step 4 - Retrieved from database:`, {
      id: retrievedReset.id,
      email: retrievedReset.email,
      hashedOtp: retrievedReset.otpHash.substring(0, 20) + '...',
      expiresAt: retrievedReset.expiresAt
    });
    
    // Step 5: Verify OTP
    const isOtpValid = await verifyOTP(otp, retrievedReset.otpHash);
    console.log(`🔍 Step 5 - OTP verification result: ${isOtpValid}`);
    
    // Step 6: Test email sending (without actually sending)
    console.log(`🔍 Step 6 - Email would contain OTP: ${otp}`);
    
    // Clean up test data
    await databaseHelpers.pool.query('DELETE FROM password_resets WHERE email = $1', [email]);
    console.log('🔍 Cleaned up test data');
    
    return NextResponse.json({
      success: true,
      message: 'Forgot password flow test completed',
      results: {
        generatedOtp: otp,
        hashedOtp: otpHash.substring(0, 20) + '...',
        storedId: passwordReset.id,
        retrievedId: retrievedReset.id,
        verificationResult: isOtpValid,
        emailOtp: otp
      }
    });
    
  } catch (error) {
    console.error('❌ Forgot password test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
