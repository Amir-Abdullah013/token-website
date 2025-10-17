# 🚨 QUICK FIX: Gmail Authentication Error

## Error You're Seeing:
```
Invalid login: 535-5.7.8 Username and Password not accepted
```

## ✅ Solution (3 Steps):

### Step 1: Generate Gmail App Password
1. Go to: **https://myaccount.google.com/apppasswords**
2. If you see "App passwords are not available", enable 2FA first:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"
   - Then return to App passwords
3. Select **"Mail"** or **"Other"**
4. Name it: "Token Website"
5. Click **Generate**
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update .env.local
Open your `.env.local` file and update:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  ← Use the App Password here
```

**Important:** 
- Use the **App Password**, NOT your regular Gmail password
- You can include or remove spaces - both work
- Make sure SMTP_USER is your full Gmail address

### Step 3: Restart Server
```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

## 🧪 Test It
1. Visit: `http://localhost:3000/test-forgot-password`
2. Enter your email
3. Click "Test Forgot Password"
4. Check your email inbox (and spam folder)

Or verify configuration:
```bash
node verify-email-config.js
```

## 📝 Your .env.local Should Look Like:
```env
# Database
DATABASE_URL=your-database-url-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop

# Cron Secret
CRON_SECRET=your-secure-random-secret-here
```

## ⚠️ Remove Duplicates
If you have SMTP credentials in both `.env` and `.env.local`:
1. **Keep them ONLY in `.env.local`**
2. **Remove from `.env`** (or leave as defaults without actual passwords)

## 🎯 Why This Happens
- Gmail blocks regular passwords for security
- You MUST use App Passwords for SMTP
- App Passwords work even if your main password changes
- More secure and can be revoked anytime

## 🆘 Still Not Working?

### Check 1: Is 2FA Enabled?
```
Go to: https://myaccount.google.com/security
Look for "2-Step Verification" - should be ON
```

### Check 2: Did You Restart Server?
```bash
# Must restart after changing .env.local
npm run dev
```

### Check 3: Are Variables Loaded?
```bash
node verify-email-config.js
```

### Check 4: Check the Console
Look for:
```
Generated OTP for your-email@gmail.com: 123456
✅ Using nodemailerModule.createTransport
```

## ✅ Success Looks Like:
```
Generated OTP for your-email@gmail.com: 709942
✅ Using nodemailerModule.createTransport
OTP email sent successfully to your-email@gmail.com: <message-id>
```

## 📚 More Help:
- Full guide: `EMAIL_SETUP_GUIDE.md`
- Alternative email services: See EMAIL_SETUP_GUIDE.md
- Still stuck? OTP is logged to console for testing

---

**Quick Summary:**
1. Generate App Password: https://myaccount.google.com/apppasswords
2. Put it in `.env.local` as `SMTP_PASS`
3. Restart server: `npm run dev`
4. Test: `/test-forgot-password`

Done! ✅

