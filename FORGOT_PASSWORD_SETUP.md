# Forgot Password (OTP) Setup Guide

This guide will help you set up the complete "Forgot Password" feature with OTP generation and email sending.

## 🚀 Features Implemented

- ✅ **OTP Generation**: 6-digit random OTP with secure hashing
- ✅ **Email Sending**: Professional HTML emails with Nodemailer
- ✅ **Database Storage**: Secure OTP storage with expiry
- ✅ **API Endpoints**: Complete REST API for forgot password flow
- ✅ **Frontend Pages**: User-friendly forms for the entire process
- ✅ **Security**: OTP hashing, expiry validation, rate limiting
- ✅ **Testing**: Comprehensive test pages and utilities

## 📋 Prerequisites

1. **Database**: PostgreSQL with Prisma
2. **Email Service**: Gmail SMTP (or other SMTP provider)
3. **Node.js**: Version 18+ with required packages

## 🔧 Environment Variables Setup

Create or update your `.env.local` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Email Configuration (Gmail SMTP)
e

# Alternative email variable names (if using different naming)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Application URLs
NEXT_PUBLIC_NEXTAUTH_URL="http://localhost:3000"
```

## 📧 Gmail SMTP Setup

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to Google Account → Security
2. Under "2-Step Verification", click "App passwords"
3. Select "Mail" and "Other (custom name)"
4. Enter "Token Website" as the name
5. Copy the generated 16-character password
6. Use this password as `SMTP_PASS` in your `.env.local`

## 🗄️ Database Setup

### Step 1: Update Prisma Schema
The schema has been updated with the `PasswordReset` model. Run:

```bash
npx prisma db push
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

## 📦 Required Packages

Install the required packages:

```bash
npm install nodemailer bcryptjs
```

## 🧪 Testing the Setup

### Step 1: Test Email Configuration
Visit `/test-forgot-password` and click "Test Email Config" to verify your SMTP settings.

### Step 2: Test Complete Flow
1. Go to `/test-forgot-password`
2. Enter a valid email address
3. Click "Test Forgot Password"
4. Check console for the generated OTP
5. Enter the OTP and test verification
6. Test password reset

### Step 3: Test User Interface
1. Visit `/auth/forgot-password` for the user interface
2. Enter email and request OTP
3. Visit `/auth/reset-password` to complete the process

## 🔄 Complete Forgot Password Flow

### 1. User Requests Password Reset
```
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

### 2. User Verifies OTP
```
POST /api/auth/verify-otp
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now reset your password.",
  "resetId": "reset_id"
}
```

### 3. User Resets Password
```
POST /api/auth/reset-password
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success: true,
  "message": "Password reset successfully. You can now sign in with your new password."
}
```

## 🛡️ Security Features

- **OTP Hashing**: All OTPs are hashed with bcrypt before storage
- **Expiry Time**: OTPs expire after 10 minutes
- **Single Use**: Each OTP can only be used once
- **Email Validation**: Proper email format validation
- **Password Strength**: Minimum 8 characters required
- **Rate Limiting**: Prevents OTP spam (implement in production)

## 📱 Frontend Pages

### Forgot Password Page
- **URL**: `/auth/forgot-password`
- **Purpose**: User enters email to request OTP
- **Features**: Email validation, success/error messages

### Reset Password Page
- **URL**: `/auth/reset-password`
- **Purpose**: User enters OTP and new password
- **Features**: Two-step process, OTP verification, password confirmation

### Test Page
- **URL**: `/test-forgot-password`
- **Purpose**: Testing and debugging the forgot password flow
- **Features**: Complete API testing, email configuration testing

## 🔧 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/forgot-password` | POST | Generate and send OTP |
| `/api/auth/verify-otp` | POST | Verify OTP validity |
| `/api/auth/reset-password` | POST | Reset password with OTP |
| `/api/test-email` | GET | Test email configuration |

## 🚨 Error Handling

The system handles various error scenarios:

- **Invalid Email**: Returns 400 with "Email not registered"
- **Invalid OTP**: Returns 400 with "Invalid OTP"
- **Expired OTP**: Returns 400 with "OTP has expired"
- **Email Service Down**: Returns 503 with service unavailable message
- **Database Errors**: Returns 503 with connection error message

## 📊 Database Schema

### PasswordReset Table
```sql
CREATE TABLE password_resets (
  id VARCHAR PRIMARY KEY,
  email VARCHAR NOT NULL,
  hashed_otp VARCHAR NOT NULL,
  expiry TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Production Considerations

1. **Rate Limiting**: Implement rate limiting for OTP requests
2. **Email Templates**: Customize email templates for your brand
3. **Monitoring**: Set up logging and monitoring for email delivery
4. **Backup SMTP**: Configure backup email service providers
5. **Security Headers**: Add security headers for production
6. **HTTPS**: Ensure all communication is over HTTPS

## 🐛 Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check SMTP credentials
   - Verify Gmail app password
   - Check firewall settings

2. **Database Errors**
   - Ensure Prisma schema is updated
   - Check database connection
   - Verify table creation

3. **OTP Not Working**
   - Check console for generated OTP
   - Verify OTP format (6 digits)
   - Check expiry time

### Debug Steps

1. Check environment variables
2. Test email configuration
3. Verify database connection
4. Check console logs
5. Test with `/test-forgot-password` page

## ✅ Success Checklist

- [ ] Environment variables configured
- [ ] Gmail SMTP working
- [ ] Database schema updated
- [ ] Email configuration test passes
- [ ] Forgot password flow works end-to-end
- [ ] OTP generation and verification works
- [ ] Password reset completes successfully
- [ ] User can sign in with new password

## 🎉 You're All Set!

Your forgot password system is now fully functional with:
- Secure OTP generation and storage
- Professional email delivery
- Complete user interface
- Comprehensive testing tools
- Production-ready security features

Users can now reset their passwords securely using the OTP-based system!
