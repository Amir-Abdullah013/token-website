#!/usr/bin/env node

/**
 * Email Configuration Verification Script
 * 
 * Run: node verify-email-config.js
 * 
 * This script checks your email configuration and helps identify issues.
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 Email Configuration Verification\n');
console.log('=' .repeat(50));

// Check environment variables
const config = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS
};

console.log('\n📋 Environment Variables:');
console.log('  SMTP_HOST:', config.SMTP_HOST || '❌ NOT SET');
console.log('  SMTP_PORT:', config.SMTP_PORT || '❌ NOT SET');
console.log('  SMTP_USER:', config.SMTP_USER || '❌ NOT SET');
console.log('  SMTP_PASS:', config.SMTP_PASS ? '✅ SET (length: ' + config.SMTP_PASS.length + ')' : '❌ NOT SET');

// Check for common issues
console.log('\n🔍 Common Issues Check:');

let hasIssues = false;

if (!config.SMTP_HOST) {
  console.log('  ❌ SMTP_HOST is not set');
  hasIssues = true;
}

if (!config.SMTP_PORT) {
  console.log('  ❌ SMTP_PORT is not set');
  hasIssues = true;
}

if (!config.SMTP_USER) {
  console.log('  ❌ SMTP_USER is not set');
  hasIssues = true;
}

if (!config.SMTP_PASS) {
  console.log('  ❌ SMTP_PASS is not set');
  hasIssues = true;
} else {
  // Check for Gmail App Password format
  if (config.SMTP_HOST?.includes('gmail')) {
    const passLength = config.SMTP_PASS.replace(/\s/g, '').length;
    if (passLength !== 16) {
      console.log('  ⚠️  Gmail App Password should be 16 characters (found: ' + passLength + ')');
      console.log('     Make sure you generated an App Password from:');
      console.log('     https://myaccount.google.com/apppasswords');
      hasIssues = true;
    } else {
      console.log('  ✅ Gmail App Password length looks correct');
    }
  }
}

if (!hasIssues) {
  console.log('  ✅ All required variables are set');
}

// Test connection (requires nodemailer)
console.log('\n🧪 Testing SMTP Connection...');

(async () => {
  try {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: parseInt(config.SMTP_PORT),
      secure: false,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });

    await transporter.verify();
    
    console.log('  ✅ SMTP connection successful!');
    console.log('\n🎉 Email service is properly configured!\n');
    
  } catch (error) {
    console.log('  ❌ SMTP connection failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Solution:');
      console.log('  1. Enable 2-Factor Authentication on your Gmail account');
      console.log('  2. Generate an App Password: https://myaccount.google.com/apppasswords');
      console.log('  3. Update SMTP_PASS in .env.local with the App Password');
      console.log('  4. Restart your Next.js server');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution:');
      console.log('  - Check your internet connection');
      console.log('  - Verify SMTP_HOST and SMTP_PORT are correct');
      console.log('  - Check firewall settings');
    }
    
    console.log('\n📖 Full setup guide: EMAIL_SETUP_GUIDE.md\n');
  }
})();

