# Password Reset User Flow

## 📋 Complete User Journey

### Step 1: User Forgets Password
**Page:** `/auth/signin`
- User clicks "Forgot Password?" link
- Redirects to `/auth/forgot-password`

### Step 2: Request OTP
**Page:** `/auth/forgot-password`

**User Actions:**
1. Enters their email address
2. Clicks "Send Reset Link" button

**System Actions:**
1. Validates email format
2. Checks if user exists in database
3. Generates 6-digit OTP
4. Hashes OTP with bcrypt (12 rounds)
5. Stores in `password_resets` table with 10-minute expiry
6. Sends OTP via email
7. Displays success message

**Success Screen Shows:**
- ✅ "OTP Sent!" message
- Email address where OTP was sent
- **"Enter OTP & Reset Password →"** button (NEW - main action)
- "Try a different email" button
- "Back to sign in" link

### Step 3: Enter OTP & Reset Password
**Page:** `/auth/reset-password?email=user@example.com`

**Part A - Verify OTP:**

**User Actions:**
1. Page opens with email pre-filled
2. User enters 6-digit OTP from email
3. Clicks "Verify OTP" button

**System Actions:**
1. Retrieves most recent unused password reset for email
2. Checks if OTP is expired (10-minute window)
3. Verifies OTP using bcrypt.compare()
4. If valid, shows password reset form
5. If invalid, shows error message

**Part B - Set New Password:**

**User Actions:**
1. Enters new password (minimum 8 characters)
2. Confirms new password
3. Clicks "Reset Password" button

**System Actions:**
1. Validates password strength
2. Confirms passwords match
3. Verifies OTP again (double-check)
4. Begins database transaction:
   - Hashes new password with bcrypt (12 rounds)
   - Updates user's password
   - Marks OTP as `used = true`
   - Commits transaction
5. Shows success message
6. Redirects to sign-in page

### Step 4: Login with New Password
**Page:** `/auth/signin`
- User logs in with new password
- Successfully authenticated

---

## 🎨 UI Flow Diagram

```
┌─────────────────────┐
│   Sign In Page      │
│                     │
│  Forgot Password? ─────┐
└─────────────────────┘   │
                          ▼
                    ┌─────────────────────────┐
                    │  Forgot Password Page   │
                    │  ┌───────────────────┐  │
                    │  │ Enter Email       │  │
                    │  └───────────────────┘  │
                    │  [Send Reset Link]      │
                    └──────────┬──────────────┘
                               │ OTP Sent
                               ▼
                    ┌─────────────────────────┐
                    │    Success Screen       │
                    │  "OTP Sent to email!"   │
                    │  ┌───────────────────┐  │
                    │  │ Check your email  │  │
                    │  │ OTP expires: 10m  │  │
                    │  └───────────────────┘  │
                    │  [Enter OTP & Reset →]  │◄── NEW BUTTON
                    └──────────┬──────────────┘
                               │
                               ▼
                    ┌─────────────────────────┐
                    │ Reset Password Page     │
                    │ ┌───────────────────┐   │
                    │ │ Email: prefilled  │   │
                    │ │ OTP: [______]     │   │
                    │ └───────────────────┘   │
                    │ [Verify OTP]            │
                    └──────────┬──────────────┘
                               │ OTP Valid
                               ▼
                    ┌─────────────────────────┐
                    │   Set New Password      │
                    │ ┌───────────────────┐   │
                    │ │ New Password      │   │
                    │ │ Confirm Password  │   │
                    │ └───────────────────┘   │
                    │ [Reset Password]        │
                    └──────────┬──────────────┘
                               │ Success
                               ▼
                    ┌─────────────────────────┐
                    │  Password Reset!        │
                    │  Redirect to Sign In    │
                    └──────────┬──────────────┘
                               │
                               ▼
                    ┌─────────────────────────┐
                    │    Sign In Page         │
                    │  Login with new pass    │
                    └─────────────────────────┘
```

---

## 🔒 Security Features

### 1. OTP Security
- ✅ 6-digit random OTP
- ✅ Hashed with bcrypt before storage
- ✅ 10-minute expiration
- ✅ One-time use enforcement
- ✅ Cannot retrieve plain OTP from database

### 2. Password Security
- ✅ Minimum 8 characters
- ✅ Hashed with bcrypt (12 salt rounds)
- ✅ Password confirmation required
- ✅ Old password immediately invalidated

### 3. Process Security
- ✅ Email verification required
- ✅ Transaction atomicity (password + OTP update)
- ✅ Automatic cleanup of expired OTPs
- ✅ Rate limiting recommended (3 per 15 min)

---

## ⏱️ Timings

| Action | Timeout | Details |
|--------|---------|---------|
| OTP Generation | Instant | < 1 second |
| Email Delivery | 1-30 seconds | Depends on SMTP |
| OTP Expiration | 10 minutes | Configurable |
| Cleanup Cron | Every hour | Removes expired OTPs |

---

## 📧 Email Content

**Subject:** Password Reset OTP - Token Website

**Body:**
```
Hello [User Name]!

You requested a password reset for your account. 
Use the following OTP to reset your password:

        [123456]

Important:
• This OTP is valid for 10 minutes only
• Do not share this OTP with anyone
• If you didn't request this reset, please ignore this email

Best regards,
Token Website Team
```

---

## 🎯 User Experience Highlights

### Before Fix:
❌ OTP sent but no clear next step
❌ User confused about where to enter OTP
❌ Had to manually navigate to `/auth/reset-password`

### After Fix:
✅ Clear "Enter OTP & Reset Password →" button
✅ Email pre-filled in reset page
✅ Obvious next action
✅ Smooth user journey

---

## 🔄 Alternative Flows

### If OTP Expired:
1. User enters expired OTP
2. System returns error: "OTP has expired"
3. User clicks "Try a different email" or goes back
4. Requests new OTP
5. Continues with fresh OTP

### If Wrong OTP:
1. User enters incorrect OTP
2. System returns error: "Invalid OTP"
3. User tries again (with correct OTP)
4. System verifies and allows password reset

### If User Not Found:
1. User enters non-existent email
2. System returns: "Email not registered"
3. User can try different email or create account

---

## 🧪 Testing the Flow

### Manual Test:
1. Visit `http://localhost:3000/auth/forgot-password`
2. Enter your test email
3. Click "Send Reset Link"
4. Check email inbox (and spam folder)
5. Copy the 6-digit OTP
6. Click "Enter OTP & Reset Password →"
7. Paste OTP in the form
8. Enter new password
9. Confirm password
10. Click "Reset Password"
11. Login with new password

### Test with Console OTP:
- OTP is also logged to server console
- Check terminal for: `Generated OTP for email@example.com: 123456`
- Use this OTP for testing

---

## 📱 Mobile Responsive

All pages are fully responsive:
- ✅ Forgot Password page
- ✅ Reset Password page
- ✅ Success screens
- ✅ Error messages

---

## 🚀 Production Checklist

- [x] Forgot password page functional
- [x] OTP generation working
- [x] Email service configured
- [x] Reset password page functional
- [x] OTP verification working
- [x] Password update working
- [x] Success/error messages clear
- [x] Email parameter passed to reset page
- [x] User journey smooth and intuitive
- [x] Mobile responsive
- [ ] Rate limiting enabled (recommended)
- [ ] Production email service configured
- [ ] Monitoring set up

---

## 💡 Tips for Users

1. **Check Spam Folder:** OTP emails might land in spam
2. **Act Quickly:** OTP expires in 10 minutes
3. **One-Time Use:** Each OTP can only be used once
4. **Need New OTP?** Request a fresh one if expired
5. **Strong Password:** Use minimum 8 characters

---

## 🔧 Admin/Developer Notes

### Monitoring Points:
- Track OTP request rate per email/IP
- Monitor failed OTP attempts
- Alert on high failure rates
- Log password reset completions

### Customization:
- OTP expiry: Change in `getOTPExpiry(10)` - default 10 minutes
- OTP length: Modify `generateOTP()` for different length
- Email template: Update in `email-service-simple.js`
- Rate limits: Add middleware for request limiting

### Troubleshooting:
- OTP not received? Check SMTP logs
- Wrong OTP error? Verify OTP from console logs
- Expired OTP? Check server time sync
- Database error? Check connection and schema

---

**Last Updated:** 2024  
**Status:** Fully Functional ✅  
**User Experience:** Improved with clear navigation ✅

