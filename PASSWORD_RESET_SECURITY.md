# Password Reset Security Documentation

## Overview
This document outlines the security measures implemented in the password reset functionality to protect against common vulnerabilities and attacks.

## Security Measures Implemented

### 1. OTP Hashing (bcrypt)
**Location:** `src/lib/otp-utils-simple.js` (lines 13-22)

**Implementation:**
```javascript
const hashOTP = async (otp) => {
  const saltRounds = 12;
  const hashedOTP = await bcrypt.hash(otp, saltRounds);
  return hashedOTP;
};
```

**Security Benefits:**
- OTPs are hashed using bcrypt with 12 salt rounds before storage
- Even if database is compromised, plain OTPs cannot be retrieved
- Bcrypt is designed to be slow, making brute-force attacks impractical
- Salt rounds of 12 provide strong resistance against rainbow table attacks

### 2. OTP Expiration (10 Minutes)
**Location:** `src/lib/otp-utils-simple.js` (lines 43-47)

**Implementation:**
```javascript
const getOTPExpiry = (minutes = 10) => {
  const now = new Date();
  const expiry = new Date(now.getTime() + (minutes * 60 * 1000));
  return expiry;
};
```

**Security Benefits:**
- Limits the window of opportunity for attackers
- Reduces risk of OTP interception and replay attacks
- Forces fresh OTP generation for each attempt

### 3. One-Time Use Enforcement
**Location:** `src/lib/database.js` (lines 2414-2433)

**Implementation:**
- OTP is marked as `used = true` immediately after successful password reset
- `getPasswordResetByEmail()` only returns unused OTPs (`used = false`)
- Transaction ensures atomicity between password update and OTP invalidation

**Security Benefits:**
- Prevents OTP reuse even within expiration window
- Protects against replay attacks
- Ensures each OTP can only reset password once

### 4. Transaction Atomicity
**Location:** `src/app/api/auth/reset-password/route.js` (lines 83-118)

**Implementation:**
```javascript
let client;
try {
  client = await databaseHelpers.pool.connect();
  await client.query('BEGIN');
  
  // Update password
  await databaseHelpers.user.updatePassword(user.id, hashedPassword);
  
  // Mark OTP as used
  await databaseHelpers.passwordReset.markPasswordResetAsUsed(passwordReset.id);
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
}
```

**Security Benefits:**
- Ensures password and OTP status update together or not at all
- Prevents inconsistent states where password is updated but OTP remains valid
- Database rollback on any failure maintains data integrity

### 5. User Enumeration Protection
**Location:** `src/app/api/auth/forgot-password/route.js` (lines 29-40)

**Current Implementation:**
```javascript
// Security Note: In production, you may want to return a generic message
// to prevent user enumeration attacks
if (!user) {
  return NextResponse.json(
    { success: false, error: 'Email not registered' },
    { status: 400 }
  );
}
```

**Production Recommendation:**
```javascript
// Always return success to prevent user enumeration
return NextResponse.json({
  success: true,
  message: 'If an account exists with this email, you will receive a password reset link.'
});
```

**Security Benefits:**
- Prevents attackers from discovering valid email addresses
- Rate limiting should still be applied
- Email will only be sent if user exists

### 6. Rate Limiting (TO BE IMPLEMENTED)
**Recommended Location:** Middleware or API route wrapper

**Recommended Implementation:**
```javascript
import rateLimit from 'express-rate-limit';

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many password reset attempts, please try again later'
});
```

**Security Benefits:**
- Prevents brute-force OTP guessing attacks
- Limits automated abuse
- Protects against DoS attacks on email service

### 7. Password Strength Requirements
**Location:** `src/app/api/auth/reset-password/route.js` (lines 33-38)

**Implementation:**
```javascript
if (newPassword.length < 8) {
  return NextResponse.json(
    { success: false, error: 'Password must be at least 8 characters long' },
    { status: 400 }
  );
}
```

**Security Benefits:**
- Enforces minimum password complexity
- Reduces risk of weak passwords

### 8. Automatic Cleanup of Expired Tokens
**Location:** `src/app/api/cron/cleanup-reset-tokens/route.js`

**Implementation:**
- Cron job runs every hour
- Deletes all expired and unused password reset tokens
- Protected by CRON_SECRET authentication

**Security Benefits:**
- Reduces attack surface by removing expired tokens
- Keeps database clean and performant
- Prevents accumulation of stale data

### 9. Secure Token Generation
**Location:** `src/lib/database.js` (line 2339)

**Implementation:**
```javascript
const { randomUUID } = await import('crypto');
const id = randomUUID();
```

**Security Benefits:**
- Uses cryptographically secure random UUID v4
- Unpredictable token IDs prevent enumeration attacks
- UUID collision probability is negligible

## Attack Vectors and Mitigations

### 1. Brute Force OTP Guessing
**Risk:** Attacker tries all possible 6-digit OTPs
**Mitigation:**
- 10-minute expiration window
- One-time use enforcement
- Rate limiting (recommended)
- Account lockout after multiple failures (recommended)

### 2. OTP Interception
**Risk:** Attacker intercepts OTP from email
**Mitigation:**
- 10-minute expiration window
- One-time use enforcement
- HTTPS encryption for all communications
- Email should use TLS encryption

### 3. Database Compromise
**Risk:** Attacker gains access to database
**Mitigation:**
- OTPs stored as bcrypt hashes (12 rounds)
- Cannot retrieve plain OTPs from hashes
- Expired tokens automatically cleaned up

### 4. Replay Attacks
**Risk:** Attacker reuses captured OTP
**Mitigation:**
- One-time use enforcement via `used` flag
- OTP invalidated immediately after use
- Short expiration window

### 5. User Enumeration
**Risk:** Attacker discovers valid email addresses
**Mitigation:**
- Generic error messages recommended for production
- Rate limiting prevents bulk testing
- Consistent response times for all scenarios

### 6. Session Hijacking
**Risk:** Attacker uses reset to gain account access
**Mitigation:**
- Secure password hashing (bcrypt 12 rounds)
- OTP verification required before password change
- Email notification of password change (recommended)

## Compliance and Best Practices

### OWASP Recommendations
✅ Use strong password hashing (bcrypt)
✅ Implement password strength requirements
✅ Use secure random token generation
✅ Set token expiration
✅ Enforce one-time use tokens
✅ Use HTTPS for all communications
⚠️  Rate limiting (recommended)
⚠️  Account lockout mechanism (recommended)

### GDPR Compliance
- Password reset logs should not store plain OTPs
- Expired tokens are automatically deleted
- User data handling follows privacy principles

## Monitoring and Logging

### Current Logging
- OTP generation (console.log - remove in production)
- Password reset creation
- OTP verification attempts
- Password reset completion
- Cleanup operations

### Recommended Additional Monitoring
- Failed OTP verification attempts
- Multiple reset requests from same IP
- Reset requests for non-existent users
- Suspicious patterns (timing, volume)

## Environment Variables

### Required
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
CRON_SECRET=your-secure-cron-secret
DATABASE_URL=postgresql://...
```

### Security Considerations
- Use app-specific passwords for email services
- Rotate CRON_SECRET regularly
- Store credentials in secure vault (e.g., Vercel secrets)
- Never commit .env files to version control

## Future Enhancements

### Recommended Improvements
1. **Rate Limiting:** Implement per-IP and per-email rate limits
2. **2FA Integration:** Optional 2FA for additional security
3. **Email Notifications:** Notify users of password changes
4. **Account Lockout:** Temporary lockout after multiple failures
5. **Audit Trail:** Comprehensive logging of all reset attempts
6. **IP Whitelisting:** Allow admins to whitelist trusted IPs
7. **Geographic Restrictions:** Flag suspicious geographic patterns
8. **Device Fingerprinting:** Track and verify device consistency

### Security Audit Checklist
- [ ] Review all error messages for information leakage
- [ ] Implement rate limiting
- [ ] Add account lockout mechanism
- [ ] Set up monitoring alerts
- [ ] Regular security testing
- [ ] Penetration testing
- [ ] Code review for security vulnerabilities

## Incident Response

### If OTP Compromise Suspected
1. Immediately run cleanup cron to invalidate all tokens
2. Review recent password reset logs
3. Alert affected users
4. Rotate CRON_SECRET and email credentials
5. Investigate source of compromise

### If Database Breach Detected
1. All OTPs are already hashed (bcrypt) - cannot be reversed
2. Rotate all secrets and credentials
3. Force password reset for all users
4. Investigate and patch vulnerability
5. Notify users as required by law

## Testing

### Security Testing Commands
```bash
# Run password reset tests
npx jest src/tests/passwordReset.test.js --runInBand

# Test OTP hashing
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('123456', 12));"

# Test cleanup cron (requires CRON_SECRET)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/cleanup-reset-tokens
```

## Contact

For security concerns or to report vulnerabilities, please contact:
- Security Team: security@yourcompany.com
- Emergency: Follow responsible disclosure policy

---

**Last Updated:** 2024
**Next Review:** Quarterly
**Document Owner:** Security Team

