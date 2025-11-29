# Staking Logic Refactoring - Summary

This document summarizes the comprehensive refactoring of the staking system to implement new requirements.

## Overview

The staking system has been refactored to:
1. Store staked tokens in the user's own account instead of admin reserve
2. Calculate rewards on a daily basis over a 365-day year, regardless of staking period
3. Automatically release staked tokens to user's VonBalance on staking end date

## Changes Made

### 1. Database Schema Changes

#### Prisma Schema (`prisma/schema.prisma`)
- Added `stakingTokensAmount` field to `Wallet` model
  - Type: `Float`
  - Default: `0`
  - Purpose: Stores locked staking tokens in user's account

#### Migration (`prisma/migrations/20250229000000_add_staking_tokens_amount/migration.sql`)
- Created migration to add `stakingTokensAmount` column to `wallets` table
- Sets default value of 0 for existing wallets

### 2. Database Helper Functions (`src/lib/database.js`)

#### New Functions Added:
- `wallet.lockStakingTokens(userId, amount)`: Locks tokens in `stakingTokensAmount`
- `wallet.unlockStakingTokens(userId, amount)`: Unlocks tokens from `stakingTokensAmount` and adds to `VonBalance`
- `wallet.getStakingTokensAmount(userId)`: Gets current locked staking tokens amount

#### Updated Functions:
- `wallet.createWallet()`: Now includes `stakingTokensAmount` in wallet creation

### 3. Staking Creation API (`src/app/api/stake/route.js`)

#### Key Changes:
- **Reward Calculation**: 
  - Old: `dailyReward = (amount * rewardPercent / 100) / durationDays`
  - New: `dailyReward = (amount * rewardPercent / 100) / 365`
  - Rewards are calculated over 365 days regardless of staking period
  - Users receive daily rewards for the full year

- **Token Storage**:
  - Old: Tokens moved to admin reserve via `depositStakeToAdminReserve()`
  - New: Tokens locked in user's account (`stakingTokensAmount` field)
  - Uses atomic transaction to deduct from `VonBalance` and add to `stakingTokensAmount`

### 4. Daily Staking Processor (`src/app/api/cron/process-stakings/route.js`)

#### Key Changes:
- **Reward Calculation**:
  - Calculates daily reward based on 365-day year: `dailyReward = annualReward / 365`
  - Users receive daily rewards for up to 365 days (full year)
  - Staking period determines when principal is released, not reward duration

- **Principal Release**:
  - Old: Principal released from admin reserve on completion
  - New: Principal automatically released from `stakingTokensAmount` to `VonBalance` on end date
  - Uses `unlockStakingTokens()` helper function

- **Reward Distribution**:
  - Rewards still paid from admin reserve (only rewards, not principal)
  - Daily rewards continue for up to 365 days regardless of staking period

### 5. Claim Endpoint (`src/app/api/stake/[id]/claim/route.js`)

#### Key Changes:
- **Principal Handling**:
  - Principal is now automatically released on end date
  - Claim endpoint only handles any remaining rewards that weren't paid out
  - No longer releases principal from admin reserve

- **Reward Calculation**:
  - Uses new 365-day reward calculation
  - Only pays remaining rewards if any

## Reward Calculation Logic

### Formula:
```javascript
annualRewardAmount = (amountStaked * rewardPercent) / 100
dailyReward = annualRewardAmount / 365
totalRewardForPeriod = dailyReward * durationDays
```

### Example:
- User stakes 1000 Von for 30 days at 15% annual rate
- Annual reward: 1000 * 0.15 = 150 Von
- Daily reward: 150 / 365 = 0.41096 Von/day
- Reward for 30 days: 0.41096 * 30 = 12.33 Von
- User receives daily rewards for up to 365 days (0.41096 Von/day)
- After 30 days, principal is automatically released to VonBalance
- Daily rewards continue for the remaining 335 days

## Token Flow

### On Staking Creation:
1. User's `VonBalance` decreases by staked amount
2. User's `stakingTokensAmount` increases by staked amount
3. Tokens remain locked in user's account

### During Staking Period:
1. Daily rewards paid from admin reserve to user's `VonBalance`
2. Rewards continue for up to 365 days
3. `stakingTokensAmount` remains locked

### On End Date:
1. Principal automatically released from `stakingTokensAmount` to `VonBalance`
2. Staking status changes to `COMPLETED`
3. Daily rewards continue if within 365-day period

## Security & Locking Mechanism

- Tokens are locked in `stakingTokensAmount` field
- Atomic transactions ensure consistency
- Users cannot withdraw staked tokens before end date
- Principal automatically unlocks on end date
- Locking prevents users from accessing staked tokens until release

## Migration Notes

1. **Run Migration**: Execute the migration to add `stakingTokensAmount` column
   ```bash
   npx prisma migrate dev
   ```

2. **Existing Stakings**: 
   - Existing stakings continue to work with old logic until they complete
   - New stakings use the new logic
   - Consider migration script for existing stakings if needed

3. **Admin Reserve**:
   - Admin reserve is now only used for rewards, not principal storage
   - Principal is stored in user accounts

## Testing Recommendations

1. Test staking creation with different durations
2. Verify tokens are locked in `stakingTokensAmount`
3. Verify daily rewards are calculated correctly (365-day basis)
4. Test automatic principal release on end date
5. Verify rewards continue for full 365 days regardless of staking period
6. Test multiple concurrent stakings per user
7. Verify claim endpoint handles remaining rewards correctly

## Benefits

1. **User Ownership**: Users own their staked tokens (locked in their account)
2. **Transparency**: Clear visibility of locked tokens in user account
3. **Consistent Rewards**: Rewards based on standardized 365-day year
4. **Automatic Release**: No manual claiming required for principal
5. **Scalability**: Efficient storage and processing for multiple users
6. **Security**: Proper locking mechanism prevents premature withdrawals

## Future Enhancements

- Add UI to display `stakingTokensAmount` in user dashboard
- Add withdrawal prevention checks for locked tokens
- Consider adding early withdrawal penalties if needed
- Add staking history and analytics

