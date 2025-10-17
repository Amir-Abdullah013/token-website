# Email Service Setup Guide

## 🚨 Gmail Authentication Error Fix

**Error:** `Invalid login: 535-5.7.8 Username and Password not accepted`

**Cause:** Gmail blocks regular password authentication for security. You must use an "App Password".

---

## ✅ Solution: Generate Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the prompts to enable 2FA (required for App Passwords)

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account > Security > 2-Step Verification > App passwords
2. Click **Select app** → Choose "Mail" or "Other (Custom name)"
3. Enter name: "Token Website Password Reset"
4. Click **Generate**
5. **Copy the 16-character password** (format: xxxx xxxx xxxx xxxx)

### Step 3: Update Environment Variables

**In `.env.local` file:**
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Use the App Password (with or without spaces)

# Cron Secret (for cleanup job)
CRON_SECRET=your-secure-random-secret-here
```

**Remove from `.env` file (keep only in `.env.local`):**
- Move all SMTP credentials to `.env.local` only
- `.env` should only contain non-sensitive defaults

### Step 4: Test Email Configuration

**Visit:** `/test-forgot-password`

**Or run this in your browser console:**
```javascript
fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your-email@example.com' })
})
.then(r => r.json())
.then(console.log);
```

---

## 📧 Alternative Email Services

If you don't want to use Gmail, here are alternatives:

### Option 1: SendGrid (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Setup:**
1. Create account: https://sendgrid.com/
2. Go to Settings > API Keys
3. Create API key with "Mail Send" permissions
4. Use "apikey" as username, API key as password

### Option 2: Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

### Option 3: AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```

### Option 4: Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

---

## 🔍 Troubleshooting

### Issue 1: "Invalid login" or "Username and Password not accepted"
**Solution:**
- ✅ Use Gmail App Password (not regular password)
- ✅ Enable 2-Factor Authentication first
- ✅ Remove spaces from App Password or keep them (both work)
- ✅ Make sure SMTP_USER is your full Gmail address

### Issue 2: "Connection timeout"
**Solution:**
- Check SMTP_HOST and SMTP_PORT are correct
- Ensure firewall allows outbound connections on port 587
- Try port 465 with `secure: true` instead

### Issue 3: "Email service not configured"
**Solution:**
- Verify environment variables are loaded
- Check `.env.local` file exists and is not ignored
- Restart your Next.js dev server after changing .env files
- Run: `npm run dev` or restart the server

### Issue 4: OTP generated but email not sent
**Solution:**
- OTP is logged to console for testing
- Check server logs for the actual error
- Verify SMTP credentials are correct
- Test SMTP connection separately

---

## 🧪 Testing Email Service

### Test 1: Check Environment Variables
```javascript
// In your API route or server component
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'missing');
```

### Test 2: Test SMTP Connection
Create: `src/app/api/test-email/route.js`
```javascript
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { testEmailConfig } = await import('../../../lib/email-service-simple');
    const result = await testEmailConfig();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

Visit: `http://localhost:3000/api/test-email`

### Test 3: Send Test Email
Use the test page: `/test-forgot-password`

1. Enter your email address
2. Click "Test Forgot Password"
3. Check console for generated OTP
4. Check your email inbox

---

## 📝 Environment File Structure

### `.env.local` (Git ignored - for local development)
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# SMTP Configuration (SENSITIVE - DO NOT COMMIT)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here

# Cron Secret
CRON_SECRET=your-secure-random-secret

# Supabase (if used)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### `.env` (Version controlled - for defaults)
```env
# Public defaults (no sensitive data)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
NODE_ENV=development
```

### `.env.production` (For production deployment)
```env
NODE_ENV=production
# Set all sensitive values in your hosting platform's environment variables
# Do not commit this file
```

---

## 🔐 Security Best Practices

1. **Never commit `.env.local` to git**
   - Add to `.gitignore`: `*.env.local`
   - Already included in Next.js default .gitignore

2. **Use App Passwords, not regular passwords**
   - More secure
   - Can be revoked without changing main password
   - Limited scope permissions

3. **Rotate credentials regularly**
   - Change App Passwords every 3-6 months
   - Use different passwords for dev/staging/prod

4. **Use environment-specific credentials**
   - Development: Use test email service
   - Production: Use professional email service (SendGrid, etc.)

5. **Store production secrets securely**
   - Use Vercel Environment Variables
   - Use AWS Secrets Manager
   - Use encrypted secret management tools

---

## 🚀 Production Setup (Vercel)

### Step 1: Add Environment Variables in Vercel Dashboard
1. Go to your project in Vercel
2. Click **Settings** > **Environment Variables**
3. Add the following:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   CRON_SECRET=your-cron-secret
   DATABASE_URL=your-production-db-url
   ```

### Step 2: Select Environment
- Choose which environments need each variable:
  - ✅ Production
  - ✅ Preview
  - ✅ Development (if needed)

### Step 3: Redeploy
- Click **Deployments** > **Redeploy**
- Or push a new commit to trigger deployment

---

## 📊 Monitoring Email Delivery

### Check Email Logs
```javascript
// In your forgot-password route
console.log('✅ OTP email sent:', {
  to: email,
  messageId: result.messageId,
  timestamp: new Date().toISOString()
});
```

### Monitor Failures
```javascript
// In catch block
console.error('❌ Email send failed:', {
  email,
  error: error.message,
  code: error.code,
  timestamp: new Date().toISOString()
});
```

### Track Success Rate
- Log all email attempts
- Track success/failure counts
- Alert on high failure rates

---

## ✅ Verification Checklist

- [ ] 2FA enabled on Gmail account
- [ ] App Password generated
- [ ] `.env.local` file updated with App Password
- [ ] Server restarted after env changes
- [ ] Test email sent successfully
- [ ] OTP received in inbox
- [ ] Password reset flow works end-to-end
- [ ] Production environment variables set
- [ ] Email logs monitored

---

## 🆘 Still Having Issues?

### Quick Fixes:
1. **Restart the server** after changing `.env.local`
2. **Check spam folder** for test emails
3. **Use lowercase** email address
4. **Remove spaces** from App Password if having issues
5. **Try a different Gmail account** for testing

### Debug Mode:
Add to your email service:
```javascript
console.log('Email Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  passConfigured: !!process.env.SMTP_PASS
});
```

### Get Help:
- Check server logs in terminal
- Look for error messages in browser console
- Review the terminal output when OTP is generated
- OTP is logged to console for testing purposes

---

**Last Updated:** 2024  
**Status:** Ready for use with proper credentials  
**Support:** Check server logs for detailed error messages

