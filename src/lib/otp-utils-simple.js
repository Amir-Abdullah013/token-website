// Simple OTP utilities for Next.js compatibility
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Generate a 6-digit OTP
const generateOTP = () => {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

// Hash OTP using bcrypt
const hashOTP = async (otp) => {
  try {
    const saltRounds = 12;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);
    return hashedOTP;
  } catch (error) {
    console.error('Error hashing OTP:', error);
    throw new Error('Failed to hash OTP');
  }
};

// Verify OTP
const verifyOTP = async (otp, hashedOTP) => {
  try {
    const isValid = await bcrypt.compare(otp, hashedOTP);
    return isValid;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

// Check if OTP is expired
const isOTPExpired = (expiryTime) => {
  const now = new Date();
  const expiry = new Date(expiryTime);
  return now > expiry;
};

// Calculate OTP expiry time (10 minutes from now)
const getOTPExpiry = (minutes = 10) => {
  const now = new Date();
  const expiry = new Date(now.getTime() + (minutes * 60 * 1000));
  return expiry;
};

// Validate OTP format
const isValidOTP = (otp) => {
  // Check if OTP is exactly 6 digits
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

export {
  generateOTP,
  hashOTP,
  verifyOTP,
  isOTPExpired,
  getOTPExpiry,
  isValidOTP
};
