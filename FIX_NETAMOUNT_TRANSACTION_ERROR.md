# Fix: netAmount Transaction Error

## Problem
```
null value in column "netAmount" of relation "transactions" violates not-null constraint
```

The `netAmount` field is required (NOT NULL) in the database, but transactions were being created without it.

## Root Cause

1. **Database Constraint**: The `transactions.netAmount` column is NOT NULL
2. **Missing Field**: Transaction creation code wasn't always providing `netAmount`
3. **No Default**: The `createTransaction` function wasn't calculating `netAmount` when it was null

## Solution Applied

### 1. Fixed `createTransaction` Function (`src/lib/database.js`)

**Before:**
```javascript
const normalizedFeeAmount = feeAmount ?? 0;
// netAmount could be null, causing database error
```

**After:**
```javascript
const normalizedFeeAmount = feeAmount ?? 0;

// CRITICAL: Calculate netAmount if not provided (amount - feeAmount)
// netAmount is required (NOT NULL) in database
const normalizedNetAmount = netAmount !== null && netAmount !== undefined 
  ? netAmount 
  : (amount - normalizedFeeAmount);
```

Now the function automatically calculates `netAmount = amount - feeAmount` if not provided.

### 2. Fixed Staking Reward Transactions

Updated all staking-related transaction creation to explicitly include `netAmount`:

**Files Fixed:**
1. `src/app/api/cron/process-stakings/route.js` - Daily staking rewards
2. `src/app/api/stake/[id]/claim/route.js` - Manual claim rewards
3. `src/app/api/stake/route.js` - Staking creation

**Example Fix:**
```javascript
// Before
await databaseHelpers.transaction.createTransaction({
  userId: staking.userId,
  type: 'STAKE_REWARD',
  amount: rewardIncrement,
  // netAmount missing!
});

// After
await databaseHelpers.transaction.createTransaction({
  userId: staking.userId,
  type: 'STAKE_REWARD',
  amount: rewardIncrement,
  feeAmount: 0, // No fees on staking rewards
  netAmount: rewardIncrement // Full amount (no fees deducted)
});
```

## What is netAmount?

`netAmount` = `amount` - `feeAmount`

- For staking rewards: `netAmount = amount` (no fees)
- For transfers: `netAmount = amount - feeAmount`
- For other transactions: `netAmount = amount - feeAmount`

## Testing

After deploying, test the cron endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://pryvons.com/api/cron/process-stakings
```

**Expected Result:**
- ✅ No "null value in column netAmount" errors
- ✅ All transactions created successfully
- ✅ `totalProcessed` > 0
- ✅ Reserve history entries created

## Prevention

The `createTransaction` function now:
1. ✅ Automatically calculates `netAmount` if not provided
2. ✅ Validates `netAmount` is a valid number
3. ✅ Ensures it's never null when inserting into database

## Files Modified

1. `src/lib/database.js` - Added automatic `netAmount` calculation
2. `src/app/api/cron/process-stakings/route.js` - Added explicit `netAmount`
3. `src/app/api/stake/[id]/claim/route.js` - Added explicit `netAmount`
4. `src/app/api/stake/route.js` - Added explicit `netAmount`

## Impact

- ✅ All future transactions will have `netAmount` calculated automatically
- ✅ Existing code that doesn't provide `netAmount` will still work
- ✅ Staking rewards now process without errors
- ✅ Database constraint violations prevented

