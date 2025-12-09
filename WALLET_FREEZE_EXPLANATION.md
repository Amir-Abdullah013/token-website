# Wallet Fee Freeze - Complete Explanation

## Scenario: User with First Deposit < $10, No Referral, Insufficient Balance

### What Happens:

1. **30-Day Trial Period**
   - User signs up
   - First deposit is less than $10
   - User doesn't refer anyone
   - 30-day free trial starts

2. **After 30 Days - Fee Processing Day**
   - Cron job runs: `/api/cron/process-wallet-fees`
   - System checks user's balance (USD + VON converted to USD)
   - If total balance < $2: **ACCOUNT GETS FROZEN**

3. **Account Freeze Details:**
   - ✅ `walletFeeLocked` = `true` in database
   - ✅ All wallet features are **DISABLED** except deposits:
     - ❌ Send/Transfer (blocked)
     - ❌ Buy tokens (blocked)
     - ❌ Sell tokens (blocked)
     - ❌ Withdraw (blocked)
     - ❌ Stake (blocked)
     - ✅ Deposit (ALLOWED - so user can pay the fee)

4. **Big Prominent Banner Displayed:**
   - 🚫 **"ACCOUNT FROZEN - PAYMENT REQUIRED"** banner
   - Red gradient background with warning icon
   - Large, prominent text
   - Shows at the top of dashboard
   - Message: "Your wallet has been locked due to an unpaid $2.00 wallet fee"
   - Clear call-to-action: "Deposit $2.00 Now" button

5. **After User Deposits:**
   - Admin approves deposit
   - System automatically processes wallet fee
   - Fee deducted from balance (or VON if needed)
   - Account automatically **UNFROZEN**
   - `walletFeeLocked` = `false`
   - All features restored
   - Success notification sent

## Visual Flow

```
User Signs Up
    ↓
First Deposit < $10
    ↓
No Referral Within 30 Days
    ↓
30 Days Pass
    ↓
Cron Job Runs
    ↓
Check Balance (USD + VON)
    ↓
Balance < $2?
    ↓ YES
┌─────────────────────┐
│  ACCOUNT FROZEN     │
│  🚫 BIG RED BANNER  │
│  All Features Locked│
│  Except Deposits    │
└─────────────────────┘
    ↓
User Deposits $2+
    ↓
Admin Approves
    ↓
Fee Auto-Processed
    ↓
Account Unfrozen ✅
```

## Banner Appearance

The frozen account banner is:
- **Large and prominent** (red gradient background)
- **Animated** (pulsing warning icon)
- **Clear messaging** ("ACCOUNT FROZEN - PAYMENT REQUIRED")
- **Action button** ("Deposit $2.00 Now")
- **Shown at top** of dashboard (before any other content)

## Code Locations

- **Freeze Logic**: `src/lib/walletFeeService.js` (lines 245-270)
- **Banner Component**: `src/components/WalletFeeStatus.js` (lines 74-106)
- **Dashboard Display**: `src/app/user/dashboard/page.js` (line 375)
- **Feature Blocking**: All API routes check `checkWalletLock()` before processing

## Summary

✅ **YES** - Account freezes when insufficient balance  
✅ **YES** - Big prominent banner is displayed  
✅ **YES** - All features locked except deposits  
✅ **YES** - Auto-unfreezes after deposit and fee payment  


