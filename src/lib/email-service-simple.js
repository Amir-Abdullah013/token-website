// Simple email service for Next.js compatibility

// Email configuration
const getEmailConfig = () => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

// Create transporter
const createTransporter = async () => {
  try {
    // Dynamic import to avoid build-time issues
    const nodemailerModule = await import('nodemailer');
    
    // Log module structure for debugging
    console.log('Nodemailer module keys:', Object.keys(nodemailerModule));
    
    // Try different ways to access nodemailer
    const nodemailer = nodemailerModule.default || nodemailerModule;
    const config = getEmailConfig();
    
    // Use createTransport (correct method name)
    if (typeof nodemailerModule.createTransport === 'function') {
      console.log('✅ Using nodemailerModule.createTransport');
      return nodemailerModule.createTransport(config);
    } else if (typeof nodemailer.createTransport === 'function') {
      console.log('✅ Using nodemailer.createTransport');
      return nodemailer.createTransport(config);
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
const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      throw new Error('Email service not configured');
    }

    // Verify transporter configuration
    await transporter.verify();

    const mailOptions = {
      from: {
        name: 'Token Website',
        address: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@tokenwebsite.com'
      },
      to: email,
      subject: 'Password Reset OTP - Token Website',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              You requested a password reset for your account. Use the following OTP to reset your password:
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
              <li>If you didn't request this reset, please ignore this email</li>
            </ul>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        Password Reset OTP
        
        Hello ${userName}!
        
        You requested a password reset for your account. Use the following OTP to reset your password:
        
        OTP: ${otp}
        
        This OTP is valid for 10 minutes only.
        Do not share this OTP with anyone.
        If you didn't request this reset, please ignore this email.
        
        Best regards,
        Token Website Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
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
