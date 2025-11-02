import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get all possible environment variable names
    const envVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS ? '[REDACTED]' : undefined,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS ? '[REDACTED]' : undefined,
    };
    
    // Check which ones are set
    const status = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
    };
    
    // Get actual values (sanitized)
    const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');
    
    return NextResponse.json({
      success: true,
      environmentVariables: envVars,
      status,
      processed: {
        user: smtpUser ? `${smtpUser.substring(0, 3)}***${smtpUser.substring(smtpUser.length - 4)}` : 'NOT SET',
        passLength: smtpPass.length,
        passSet: !!smtpPass && smtpPass.length > 0,
        userSet: !!smtpUser && smtpUser.length > 0,
      },
      recommendations: {
        needsRestart: !process.env.SMTP_USER && !process.env.SMTP_PASS,
        usingGmail: (process.env.SMTP_HOST || '').includes('gmail') || !process.env.SMTP_HOST,
        appPasswordFormat: smtpPass.length === 16 ? '✅ Correct length' : `❌ Should be 16 chars, found ${smtpPass.length}`
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

