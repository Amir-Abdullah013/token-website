# Wallet Fee Referral System - Quick Start Guide

## 🚀 Quick Implementation Steps

### 1. Database Setup (Required)
```bash
# Generate Prisma client with new schema
npm run db:generate

# Push schema changes to database
npm run db:push

# OR apply migration manually
psql $DATABASE_URL -f prisma/migrations/20250119000000_add_wallet_fee_locked/migration.sql
```

### 2. Environment Variables (Required)
Add to your `.env` file:
```env
# Cron job authentication secret
CRON_SECRET=your-secure-random-string-here
```

On Vercel, add this to your environment variables:
- Go to Project Settings → Environment Variables
- Add `CRON_SECRET` with a secure random value

### 3. Deploy to Vercel (Required for Cron)
```bash
# Commit all changes
git add .
git commit -m "Implement Wallet Fee Referral System"
git push

# Vercel will automatically:
# - Deploy the new code
# - Set up the cron job (runs daily at midnight)
```

### 4. Integrate Dashboard Component (Recommended)
Add to your dashboard page:
```jsx
// In src/app/user/dashboard/page.js (or wherever your dashboard is)
import WalletFeeStatus from '@/components/WalletFeeStatus';

export default function Dashboard() {
  return (
    <div>
      {/* Add at the top of dashboard for visibility */}
      <WalletFeeStatus />
      
      {/* Rest of your dashboard components */}
    </div>
  );
}
```

### 5. Testing (Recommended)

#### Test User Creation
```bash
# Create a test user via signup
# Check database to verify walletFeeDueAt is set
```

#### Test Referral Flow
```bash
# 1. User A signs up (gets referral code)
# 2. User B signs up with User A's referral code
# 3. User B stakes $20
# 4. Check: User A's walletFeeWaived should be true
```

#### Test Cron Job
```bash
# Call the endpoint manually (replace with your cron secret)
curl https://your-site.vercel.app/api/cron/process-wallet-fees \
  -H "Authorization: Bearer your-cron-secret"
```

#### Test Wallet Lock
```bash
# 1. Create test user with $1 balance
# 2. Set walletFeeDueAt to past date
# 3. Call process-fee endpoint
# 4. Verify wallet is locked
# 5. Try to buy/sell/transfer → should be blocked
```

## 📋 Configuration Reference

### Fee Constants
In `src/lib/walletFeeService.js`:
```javascript
const WALLET_FEE_AMOUNT = 2;           // $2 fee
const FREE_TRIAL_DAYS = 30;            // 30-day trial
const MINIMUM_REFERRAL_STAKE = 20;     // $20 minimum stake
```

### Cron Schedule
In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/process-wallet-fees",
      "schedule": "0 0 * * *"  // Daily at midnight UTC
    }
  ]
}
```

To change schedule:
- `0 0 * * *` = Daily at midnight
- `0 */6 * * *` = Every 6 hours
- `0 12 * * *` = Daily at noon
- `0 0 * * 0` = Weekly on Sunday

## 🔧 Common Customizations

### Change Fee Amount
```javascript
// In src/lib/walletFeeService.js
const WALLET_FEE_AMOUNT = 5; // Change to $5
```

### Change Trial Period
```javascript
// In src/lib/walletFeeService.js
const FREE_TRIAL_DAYS = 14; // Change to 14 days
```

### Change Minimum Referral Stake
```javascript
// In src/lib/walletFeeService.js
const MINIMUM_REFERRAL_STAKE = 50; // Change to $50
```

### Exclude Deposit from Lock
Already implemented! Deposits are intentionally NOT blocked when wallet is locked, so users can deposit to unlock their wallet.

## 📊 Monitoring Dashboard Queries

### Check System Status
```sql
-- Users in trial
SELECT COUNT(*) as in_trial FROM users 
WHERE "walletFeeProcessed" = false AND "walletFeeDueAt" > NOW();

-- Fees collected today
SELECT COUNT(*) as fees_today, SUM(amount) as total_amount
FROM transactions 
WHERE type = 'WALLET_FEE' 
  AND "createdAt" >= CURRENT_DATE;

-- Locked wallets
SELECT COUNT(*) as locked_wallets FROM users WHERE "walletFeeLocked" = true;

-- Waiver rate
SELECT 
  COUNT(*) FILTER (WHERE "walletFeeWaived") * 100.0 / NULLIF(COUNT(*), 0) as waiver_rate_percent
FROM users WHERE "walletFeeProcessed" = true;
```

## 🐛 Troubleshooting Quick Fixes

### Issue: Users created before implementation don't have walletFeeDueAt
```sql
-- Fix: Set walletFeeDueAt for existing users
UPDATE users 
SET "walletFeeDueAt" = "createdAt" + INTERVAL '30 days'
WHERE "walletFeeDueAt" IS NULL;
```

### Issue: Need to reset a user's fee for testing
```bash
# Use the test endpoint
curl -X POST https://your-site.com/api/test/reset-wallet-fee \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{"userId": "user-id-here"}'
```

### Issue: Cron job not running
1. Check Vercel Dashboard → Project → Deployments → (latest) → Functions
2. Look for cron job logs
3. Verify `CRON_SECRET` is set in environment variables
4. Test manually with curl

### Issue: Wallet locked but deposit doesn't unlock
The deposit endpoint allows transactions even when locked. After depositing, the user should:
1. Call `/api/wallet/process-fee` to manually process the fee
2. OR wait for the daily cron job to process it automatically

## 📱 User Communication Templates

### Email/Notification: Trial Starting
```
Welcome! You have 30 days of free access to all features.

Want to keep your account free forever?
Simply refer a friend who stakes $20 or more.

Your referral link: [LINK]
```

### Email/Notification: 7 Days Remaining
```
⏰ 7 days left in your free trial!

Avoid the $2 wallet fee by referring a friend who stakes $20+.
Share your referral link: [LINK]
```

### Email/Notification: Fee Waived
```
🎉 Congratulations!

Your wallet fee has been waived because your referral staked $20.
Enjoy unlimited free access to all features!
```

### Email/Notification: Fee Charged
```
Your 30-day trial has ended.

A one-time $2 wallet fee has been deducted from your balance.
New balance: $X.XX

You now have unlimited access to all features.
```

### Email/Notification: Wallet Locked
```
⚠️ Action Required

Your wallet is locked because the $2 fee is due but you have insufficient balance.

Please deposit at least $2 to unlock your wallet:
[DEPOSIT LINK]
```

## ✅ Pre-Launch Checklist

- [ ] Database migration applied
- [ ] Prisma client generated
- [ ] CRON_SECRET environment variable set
- [ ] Code deployed to production
- [ ] WalletFeeStatus component added to dashboard
- [ ] Test user creation → walletFeeDueAt is set
- [ ] Test referral flow → fee waived correctly
- [ ] Test cron job → fees processed correctly
- [ ] Test wallet lock → actions blocked correctly
- [ ] Monitoring queries saved for dashboard
- [ ] User communication templates ready

## 🎯 Success Indicators (First 30 Days)

After launch, track:
- ✅ 20%+ of users complete referrals
- ✅ 80%+ of fees collected successfully (not locked)
- ✅ < 5% of wallets locked
- ✅ Cron job runs daily without errors
- ✅ No complaints about fee system

## 📞 Support Responses

### "Why am I being charged $2?"
> After your 30-day free trial, there's a one-time $2 wallet fee. You could have avoided this by referring a friend who stakes $20 or more within your first 30 days.

### "My wallet is locked, what do I do?"
> Your wallet is locked because the $2 fee was due but you had insufficient balance. Simply deposit $2 or more, and your wallet will be unlocked automatically.

### "I referred someone but still got charged"
> The referral exemption only applies if your referred friend stakes at least $20 BEFORE your 30-day trial ends. Check your referral status in your dashboard.

### "Can I get a refund?"
> The $2 fee is non-refundable as it covers platform maintenance. However, you now have unlimited access to all features.

---

## 🎉 You're All Set!

The Wallet Fee Referral System is now ready to:
- Drive user growth through referrals
- Generate sustainable revenue
- Maintain platform quality
- Provide excellent user experience

For detailed documentation, see `WALLET_FEE_REFERRAL_SYSTEM.md`.

**Questions?** Check the troubleshooting section or review the code comments.

**Good luck!** 🚀


