# Wallet Fee Referral System - Complete Documentation

## 🎯 Overview

The Wallet Fee Referral System implements a 30-day free trial with a one-time $2 wallet fee that can be waived through referrals. This system incentivizes user growth while ensuring platform sustainability.

## 📋 Feature Summary

### Core Concept
- **Free Trial**: 30-day trial period starting from signup
- **One-Time Fee**: $2 wallet fee charged after trial expires
- **Referral Exemption**: Fee waived if user refers someone who stakes ≥ $20 within 30 days
- **Wallet Lock**: If insufficient balance, wallet actions are disabled until fee is paid

### User Journey

```
┌─────────────────────────────────────────────────────────────┐
│ Day 0: User Signs Up                                        │
│ ✓ walletFeeDueAt = createdAt + 30 days                    │
│ ✓ All wallet features available                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Within 30 Days: User Refers Friend                         │
│ ✓ Friend signs up with referral code                       │
│ ✓ Friend stakes ≥ $20                                      │
│ ✓ Fee automatically waived (walletFeeWaived = true)       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (No referral)
┌─────────────────────────────────────────────────────────────┐
│ Day 30+: Fee Due                                            │
│                                                             │
│ If balance ≥ $2:                                           │
│   ✓ Fee automatically deducted                             │
│   ✓ Fee goes to admin wallet                               │
│   ✓ Wallet remains active                                  │
│                                                             │
│ If balance < $2:                                           │
│   ✗ Wallet locked (walletFeeLocked = true)                │
│   ✗ All wallet actions disabled                            │
│   ✓ User must deposit ≥ $2 to unlock                       │
└─────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

### User Model Fields

```prisma
model User {
  // ... existing fields ...
  
  // Wallet fee system
  walletFeeDueAt        DateTime?  // Date when fee becomes due (signup + 30 days)
  walletFeeProcessed    Boolean   @default(false)  // Has fee been processed?
  walletFeeWaived       Boolean   @default(false)  // Was fee waived via referral?
  walletFeeLocked       Boolean   @default(false)  // Is wallet locked due to unpaid fee?
  walletFeeProcessedAt  DateTime?  // When was fee processed?
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `walletFeeDueAt` | DateTime? | Date when the $2 fee becomes due (30 days after signup) |
| `walletFeeProcessed` | Boolean | `true` if fee has been charged or waived, `false` if pending |
| `walletFeeWaived` | Boolean | `true` if fee was waived due to successful referral |
| `walletFeeLocked` | Boolean | `true` if wallet is locked due to insufficient balance |
| `walletFeeProcessedAt` | DateTime? | Timestamp of when fee was processed |

## 🔧 Implementation Components

### 1. Service Layer (`src/lib/walletFeeService.js`)

Core functions:

```javascript
// Schedule wallet fee for new user
scheduleWalletFee(user) → sets walletFeeDueAt

// Process fee for specific user
processWalletFeeForUser(userId) → {
  status: 'charged' | 'waived' | 'locked' | 'pending'
}

// Check referral exemption
checkReferralExemption(userId, dueDate) → boolean

// Process all due fees (cron job)
processAllDueWalletFees() → results summary

// Check if wallet action is allowed
checkWalletActionAllowed(userId) → { allowed, reason }

// Handle referral fee waiver
handleReferralFeeWaiver(referrerId) → boolean
```

### 2. API Endpoints

#### User Endpoint: `/api/wallet/process-fee`
```javascript
GET/POST /api/wallet/process-fee
Authentication: Required (User token)
Purpose: Manually process current user's wallet fee
Returns: { success, result: { status, message } }
```

#### Cron Endpoint: `/api/cron/process-wallet-fees`
```javascript
GET /api/cron/process-wallet-fees
Authentication: Cron secret (Bearer token)
Purpose: Batch process all due wallet fees
Schedule: Daily at midnight (0 0 * * *)
Returns: { success, results: { total, charged, waived, locked } }
```

#### Status Endpoint: `/api/user/wallet-fee-status`
```javascript
GET /api/user/wallet-fee-status
Authentication: Required (User token)
Purpose: Get wallet fee status for dashboard
Returns: {
  walletFeeDueAt,
  walletFeeProcessed,
  walletFeeWaived,
  walletFeeLocked,
  daysRemaining,
  isPending,
  feeAmount
}
```

#### Test Endpoint: `/api/test/reset-wallet-fee`
```javascript
POST /api/test/reset-wallet-fee
Body: { userId }
Authentication: Admin only (production)
Purpose: Reset wallet fee fields for testing
Returns: { success, userId, newDueDate }
```

### 3. Frontend Component

**WalletFeeStatus Component** (`src/components/WalletFeeStatus.js`)

Displays:
- ⏰ **Pending**: Trial period countdown with referral call-to-action
- 🎁 **Waived**: Success message when fee is waived
- ✅ **Charged**: Confirmation when fee is charged
- ⚠️ **Locked**: Warning with deposit call-to-action

Usage:
```jsx
import WalletFeeStatus from '@/components/WalletFeeStatus';

// In dashboard
<WalletFeeStatus />
```

### 4. Wallet Lock Enforcement

All wallet actions check lock status:
- `/api/withdraw` ✓
- `/api/tiki/buy` ✓
- `/api/tiki/sell` ✓
- `/api/transfer` ✓
- `/api/stake` ✓
- `/api/deposit` ✗ (Intentionally allowed - needed to unlock wallet)

Implementation:
```javascript
import { checkWalletLock, createWalletLockedResponse } from '@/lib/walletLockCheck';

const lockCheck = await checkWalletLock(userId);
if (!lockCheck.allowed) {
  return createWalletLockedResponse();
}
```

## 🔄 Workflow Details

### Signup Flow
```javascript
// In src/app/api/auth/signup/route.js
1. Create user account
2. Create wallet
3. Schedule wallet fee: walletFeeDueAt = now + 30 days
```

### Staking Flow (Referral Check)
```javascript
// In src/app/api/stake/route.js
1. User stakes tokens
2. If amount >= $20 AND user has referrer:
   a. Award referral bonus to referrer
   b. Check if referrer's fee is pending
   c. If pending: waive referrer's fee
   d. Send notification to referrer
```

### Cron Job Flow
```javascript
// Daily at midnight via Vercel Cron
1. Query all users where:
   - walletFeeDueAt <= NOW()
   - walletFeeProcessed = false
2. For each user:
   a. Check referral exemption
   b. If exempt: waive fee
   c. Else if balance >= $2: charge fee
   d. Else: lock wallet
3. Return summary of processed fees
```

### Fee Processing Logic
```javascript
if (walletFeeProcessed) {
  return "Already processed";
}

if (now < walletFeeDueAt) {
  return "Pending - not due yet";
}

if (checkReferralExemption(userId, walletFeeDueAt)) {
  waiveFee();
  return "Waived";
}

if (balance >= 2) {
  deductFee();
  creditToAdmin();
  return "Charged";
} else {
  lockWallet();
  return "Locked";
}
```

## 📊 Database Queries

### Get Due Wallet Fees
```sql
SELECT id, email, "walletFeeDueAt"
FROM users
WHERE "walletFeeDueAt" <= NOW()
  AND "walletFeeProcessed" = false;
```

### Check Referral Exemption
```sql
-- Get referred users
SELECT r."referredId"
FROM referrals r
WHERE r."referrerId" = $userId;

-- Check if any referred user staked >= $20 before due date
SELECT "amountStaked", "createdAt"
FROM staking
WHERE "userId" = $referredId
  AND "amountStaked" >= 20
  AND "createdAt" <= $dueDate
LIMIT 1;
```

### Update Fee Status
```sql
UPDATE users
SET "walletFeeProcessed" = true,
    "walletFeeWaived" = true,
    "walletFeeLocked" = false,
    "walletFeeProcessedAt" = NOW()
WHERE id = $userId;
```

## 🎨 UI/UX Elements

### Dashboard Banner States

#### 1. Trial Active (Pending)
```
┌─────────────────────────────────────────────────┐
│ 🎁 Free Trial Active - 15 Days Remaining       │
│                                                  │
│ To avoid a $2 wallet fee, refer a friend who   │
│ stakes at least $20 by January 31, 2025.       │
│                                                  │
│ [Get Referral Link]  [Copy Link]               │
└─────────────────────────────────────────────────┘
```

#### 2. Fee Waived
```
┌─────────────────────────────────────────────────┐
│ ✅ Wallet Fee Waived!                          │
│                                                  │
│ Your wallet fee has been permanently waived     │
│ because you referred a user who staked $20+.   │
└─────────────────────────────────────────────────┘
```

#### 3. Wallet Locked
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Wallet Locked - Payment Required            │
│                                                  │
│ Please deposit at least $2.00 to unlock your   │
│ wallet and resume all activities.              │
│                                                  │
│ [Deposit Now]                                   │
└─────────────────────────────────────────────────┘
```

## 🚀 Deployment Checklist

### Environment Variables
```env
# Required for cron job authentication
CRON_SECRET=your-secure-random-string-here
```

### Vercel Configuration
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-wallet-fees",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Database Migration
```bash
# Apply Prisma schema changes
npm run db:push

# Or create migration
npm run db:migrate

# Run SQL migration manually
psql $DATABASE_URL < prisma/migrations/20250119000000_add_wallet_fee_locked/migration.sql
```

### Testing Steps
1. ✅ Create test user and verify `walletFeeDueAt` is set
2. ✅ Test referral flow: user signs up → stakes $20 → referrer fee waived
3. ✅ Test fee deduction: user with $5 balance → fee due → balance becomes $3
4. ✅ Test wallet lock: user with $1 balance → fee due → wallet locked
5. ✅ Test cron job: `/api/cron/process-wallet-fees` with Bearer token
6. ✅ Test UI components: dashboard shows correct status
7. ✅ Test wallet lock enforcement: locked user cannot buy/sell/transfer
8. ✅ Test unlock: deposit $2 → fee deducted → wallet unlocked

## 📈 Monitoring & Analytics

### Key Metrics to Track
- Total users in trial period
- Fee waiver rate (% of users who get fee waived)
- Average days to referral completion
- Total fees collected
- Locked wallet count

### SQL Queries for Monitoring

```sql
-- Users in trial period
SELECT COUNT(*) FROM users 
WHERE "walletFeeProcessed" = false 
  AND "walletFeeDueAt" > NOW();

-- Fee waiver rate
SELECT 
  COUNT(*) FILTER (WHERE "walletFeeWaived" = true) * 100.0 / COUNT(*) as waiver_rate
FROM users 
WHERE "walletFeeProcessed" = true;

-- Total fees collected (from transactions)
SELECT SUM(amount) 
FROM transactions 
WHERE type = 'WALLET_FEE' 
  AND status = 'COMPLETED';

-- Locked wallets
SELECT COUNT(*) FROM users WHERE "walletFeeLocked" = true;
```

## 🔒 Security Considerations

1. **Cron Job Security**: Uses Bearer token authentication
2. **Admin Wallet**: Fees credited to first admin user's wallet
3. **Transaction Records**: All fee charges logged in transactions table
4. **Rate Limiting**: Consider adding rate limits to prevent abuse
5. **Audit Trail**: All fee operations logged with timestamps

## 🐛 Troubleshooting

### Issue: Fee not processing
**Solution**: Check `walletFeeDueAt` is in the past and `walletFeeProcessed` is false

### Issue: Referral waiver not working
**Solution**: Verify:
- Referral record exists
- Referred user staked >= $20
- Stake occurred before referrer's `walletFeeDueAt`

### Issue: Wallet remains locked after deposit
**Solution**: Manually process fee:
```bash
curl -X GET https://yoursite.com/api/wallet/process-fee \
  -H "Authorization: Bearer USER_TOKEN"
```

### Issue: Cron job not running
**Solution**: 
1. Check Vercel dashboard for cron logs
2. Verify `CRON_SECRET` environment variable
3. Test endpoint manually with curl

## 📝 Code Examples

### Check User's Fee Status
```javascript
import { databaseHelpers } from '@/lib/database';

const feeStatus = await databaseHelpers.walletFee.getWalletFeeStatus(userId);
console.log(feeStatus);
// {
//   walletFeeDueAt: '2025-02-15T00:00:00Z',
//   walletFeeProcessed: false,
//   walletFeeWaived: false,
//   walletFeeLocked: false,
//   walletFeeProcessedAt: null
// }
```

### Manually Process Fee
```javascript
import walletFeeService from '@/lib/walletFeeService';

const result = await walletFeeService.processWalletFeeForUser(userId);
console.log(result);
// {
//   status: 'charged',
//   message: 'Wallet fee successfully charged',
//   feeAmount: 2,
//   previousBalance: 10,
//   newBalance: 8
// }
```

### Test Cron Job Locally
```bash
# Set environment variable
export CRON_SECRET="your-secret"

# Call endpoint
curl http://localhost:3000/api/cron/process-wallet-fees \
  -H "Authorization: Bearer your-secret"
```

## 🎯 Success Metrics

After implementation, expect:
- 📈 **Increased Referrals**: 20-30% of users will refer to avoid fee
- 💰 **Revenue Stream**: $2 × (users who don't refer) = sustainable income
- 👥 **User Growth**: Referral system drives organic growth
- 🔒 **Platform Quality**: Free trial filters serious users

## 📚 Additional Resources

- **Prisma Documentation**: https://www.prisma.io/docs
- **Vercel Cron Jobs**: https://vercel.com/docs/cron-jobs
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction

---

## ✅ Implementation Complete

All components have been implemented:
- ✅ Database schema updated
- ✅ Service layer created
- ✅ API endpoints implemented
- ✅ Frontend component built
- ✅ Wallet lock enforcement added
- ✅ Cron job configured
- ✅ Documentation complete

**Ready for production deployment!** 🚀


