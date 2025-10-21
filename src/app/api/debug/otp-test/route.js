import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing OTP generation and consistency...');
    
    // Import OTP utilities
    const { generateOTP, hashOTP, verifyOTP } = await import('../../../../lib/otp-utils-simple.js');
    
    // Generate multiple OTPs to test consistency
    const otps = [];
    for (let i = 0; i < 5; i++) {
      const otp = generateOTP();
      otps.push(otp);
      console.log(`Generated OTP ${i + 1}: ${otp}`);
    }
    
    // Test hashing and verification
    const testOtp = generateOTP();
    console.log(`Test OTP: ${testOtp}`);
    
    const hashedOtp = await hashOTP(testOtp);
    console.log(`Hashed OTP: ${hashedOtp.substring(0, 20)}...`);
    
    const isValid = await verifyOTP(testOtp, hashedOtp);
    console.log(`OTP verification result: ${isValid}`);
    
    // Test with wrong OTP
    const wrongOtp = '123456';
    const isWrongValid = await verifyOTP(wrongOtp, hashedOtp);
    console.log(`Wrong OTP verification result: ${isWrongValid}`);
    
    return NextResponse.json({
      success: true,
      message: 'OTP test completed',
      results: {
        generatedOtps: otps,
        testOtp: testOtp,
        hashedOtp: hashedOtp.substring(0, 20) + '...',
        verificationResult: isValid,
        wrongOtpResult: isWrongValid
      }
    });
    
  } catch (error) {
    console.error('❌ OTP test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
