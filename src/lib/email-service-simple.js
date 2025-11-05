// Simple email service for Next.js compatibility

// Email configuration
const getEmailConfig = () => {
  // Get credentials - check both possible env var names
  // In Next.js, make sure to check process.env directly
  const smtpUserRaw = process.env.SMTP_USER || process.env.EMAIL_USER || '';
  const smtpPassRaw = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
  
  // Trim and clean
  const smtpUser = String(smtpUserRaw).trim();
  // Remove ALL whitespace from password (including spaces, tabs, newlines)
  const smtpPass = String(smtpPassRaw).trim().replace(/\s+/g, '');
  
  // Log configuration for debugging (without exposing password)
  console.log('📧 Email Config Check:', {
    host: process.env.SMTP_HOST || 'gmail (default)',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: smtpUser ? `${smtpUser.substring(0, 3)}***${smtpUser.substring(smtpUser.length - 4)}` : 'NOT SET',
    passSet: !!smtpPass,
    passLength: smtpPass ? smtpPass.length : 0,
    usingGmailService: (process.env.SMTP_HOST || '').includes('gmail.com') || !process.env.SMTP_HOST
  });
  
  if (!smtpUser || !smtpPass) {
    console.error('❌ SMTP credentials not configured!');
    console.error('   SMTP_USER:', smtpUser ? 'SET' : 'NOT SET');
    console.error('   SMTP_PASS:', smtpPass ? 'SET' : 'NOT SET');
  }
  
  // Build config object
  const config = {
    host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // Use TLS instead of SSL for port 587
    requireTLS: true,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };
  
  // For Gmail specifically, we can use service OR host/port
  // Using host/port is more explicit and reliable
  return config;
};

// Create transporter
const createTransporter = async () => {
  try {
    // Dynamic import to avoid build-time issues
    const nodemailerModule = await import('nodemailer');
    
    // Get configuration
    const config = getEmailConfig();
    
    // Detailed logging of config (without password)
    console.log('📧 Creating transporter with config:', {
      ...config,
      auth: {
        user: config.auth?.user || 'NOT SET',
        pass: config.auth?.pass ? `[${config.auth.pass.length} chars]` : 'NOT SET'
      }
    });
    
    // Validate config before creating transporter
    if (!config.auth?.user || !config.auth?.pass) {
      console.error('❌ Email config missing credentials!');
      console.error('   User:', config.auth?.user || 'MISSING');
      console.error('   Pass:', config.auth?.pass ? 'SET' : 'MISSING');
      throw new Error('SMTP credentials not configured - check SMTP_USER and SMTP_PASS environment variables');
    }
    
    // Try different ways to access nodemailer
    const nodemailer = nodemailerModule.default || nodemailerModule;
    
    // Use createTransport (correct method name)
    if (typeof nodemailerModule.createTransport === 'function') {
      console.log('✅ Using nodemailerModule.createTransport');
      const transporter = nodemailerModule.createTransport(config);
      return transporter;
    } else if (typeof nodemailer.createTransport === 'function') {
      console.log('✅ Using nodemailer.createTransport');
      const transporter = nodemailer.createTransport(config);
      return transporter;
    } else {
      console.error('❌ Could not find createTransport method');
      console.error('Available methods:', Object.keys(nodemailer));
      return null;
    }
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

// Send OTP email
const sendOTPEmail = async (email, otp, userName = 'User', type = 'password-reset') => {
  try {
    console.log(`🔍 Email service: Sending ${type} OTP ${otp} to ${email} for user ${userName}`);
    
    const transporter = await createTransporter();
    
    if (!transporter) {
      throw new Error('Email service not configured - transporter could not be created');
    }

    // Verify transporter configuration
    console.log('🔍 Verifying email transporter configuration...');
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError.message);
      throw verifyError;
    }

    // Generate email content based on type
    const emailContent = generateOTPEmailContent(otp, userName, type);

    const mailOptions = {
      from: {
        name: 'Pryvons',
        address: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@tokenwebsite.com'
      },
      to: email,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      type: type
    };

  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    
    // Provide more helpful error messages for common issues
    let errorMessage = `Failed to send email: ${error.message}`;
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      errorMessage = 'Email authentication failed. Please check your SMTP credentials. ' +
        'For Gmail, ensure you are using an App Password (not your regular password). ' +
        'Generate one at: https://myaccount.google.com/apppasswords';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Email server connection failed. Please check your SMTP_HOST and SMTP_PORT settings.';
    } else if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      errorMessage = 'Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.';
    }
    
    throw new Error(errorMessage);
  }
};

// Generate email content based on type
const generateOTPEmailContent = (otp, userName, type) => {
  const getTitle = () => {
    if (type === 'signin') return 'Sign In Verification';
    if (type === 'signup') return 'Account Verification';
    return 'Password Reset';
  };

  const getMessage = () => {
    if (type === 'signin') {
      return 'You are signing in to your account. Use the following OTP to complete your sign-in:';
    }
    if (type === 'signup') {
      return 'You are creating a new account. Use the following OTP to complete your registration:';
    }
    return 'You requested a password reset for your account. Use the following OTP to reset your password:';
  };

  const getWarning = () => {
    if (type === 'signin') {
      return 'If you didn\'t attempt to sign in, please secure your account immediately';
    }
    if (type === 'signup') {
      return 'If you didn\'t attempt to create an account, please ignore this email';
    }
    return 'If you didn\'t request this reset, please ignore this email';
  };

  const getSubject = () => {
    if (type === 'signin') return 'Sign In Verification Code - Pryvons';
    if (type === 'signup') return 'Account Verification Code - Pryvons';
    return 'Password Reset OTP - Pryvons';
  };

  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${getTitle()}</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          ${getMessage()}
        </p>
        
        <div style="background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h3 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h3>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          <strong>Important:</strong>
        </p>
        <ul style="color: #666; font-size: 14px; line-height: 1.6; padding-left: 20px;">
          <li>This OTP is valid for <strong>10 minutes</strong> only</li>
          <li>Do not share this OTP with anyone</li>
          <li>${getWarning()}</li>
        </ul>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;

  return {
    subject: getSubject(),
    html: baseStyle
  };
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      return {
        success: false,
        error: 'Email service not configured'
      };
    }

    await transporter.verify();
    
    return {
      success: true,
      message: 'Email configuration is valid'
    };

  } catch (error) {
    return {
      success: false,
      error: `Email configuration failed: ${error.message}`
    };
  }
};

export {
  sendOTPEmail,
  testEmailConfig
};
