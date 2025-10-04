const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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

// Generate secure random OTP (alternative method)
const generateSecureOTP = (length = 6) => {
  const chars = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    otp += chars[randomIndex];
  }
  
  return otp;
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

// Format OTP for display (adds spaces for readability)
const formatOTP = (otp) => {
  if (otp.length === 6) {
    return `${otp.slice(0, 3)} ${otp.slice(3)}`;
  }
  return otp;
};

// Validate OTP format
const isValidOTP = (otp) => {
  // Check if OTP is exactly 6 digits
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

// Generate OTP with retry logic
const generateOTPWithRetry = (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const otp = generateSecureOTP();
      if (isValidOTP(otp)) {
        return otp;
      }
    } catch (error) {
      console.error(`OTP generation attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) {
        throw new Error('Failed to generate valid OTP after multiple attempts');
      }
    }
  }
  throw new Error('Failed to generate valid OTP');
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  generateSecureOTP,
  isOTPExpired,
  getOTPExpiry,
  formatOTP,
  isValidOTP,
  generateOTPWithRetry
};
