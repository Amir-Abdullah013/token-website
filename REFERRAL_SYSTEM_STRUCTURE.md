# Referral System Structure

This document explains the referral system structure in the database schema to avoid confusion.

## Overview

The referral system uses **3 main components** that work together:

1. **User.referrerId** - Quick lookup field
2. **Referral model** - Detailed relationship tracking
3. **ReferralEarning model** - Earnings tracking

## Component Details

### 1. User Model - Referral Fields

```prisma
referrerId    String?  // Direct reference to the user who referred this user (for quick lookups)
referralCode  String?  @unique // User's unique referral code
hasReferredOne Boolean @default(false) // Whether user has referred at least 1 user
```

**Purpose**: 
- `referrerId` provides quick access to who referred a user (used in plan purchases)
- `referralCode` is the unique code users share
- `hasReferredOne` tracks if user has successfully referred someone

**Relations**:
- `referrer` - The user who referred this user (self-referential)
- `referrals` - Users referred by this user (inverse relation)
- `sentReferrals` - Referral records where this user is the referrer
- `receivedReferrals` - Referral record where this user was referred

### 2. Referral Model

```prisma
model Referral {
  referrerId  String   // User who sent the referral
  referredId  String   // User who signed up with the referral
  earnings    ReferralEarning[] // Earnings from this relationship
}
```

**Purpose**: 
- Tracks the referral relationship in detail
- Used for analytics and detailed tracking
- Links to ReferralEarning records

**When Created**: When a user signs up with a referral code

**Note**: This is separate from `User.referrerId` for detailed tracking and analytics. Both should be in sync.

### 3. ReferralEarning Model

```prisma
model ReferralEarning {
  referralId      String   // Reference to the referral relationship
  stakingId       String?  // OLD: From staking system (deprecated)
  planPurchaseId  String?  // NEW: From plan purchase system
  amount          Float    // Amount earned by referrer
}
```

**Purpose**: 
- Tracks earnings generated from referrals
- Supports both old staking system and new plan purchase system
- Links back to the Referral relationship

**Note**: Plan purchase referral rewards are also tracked via `Transaction` (type: `REFERRAL_REWARD`) for transaction history.

## How It Works Together

### Plan Purchase Flow:

1. User purchases a plan
2. System checks `User.referrerId` to find referrer
3. 40% of plan amount goes to referrer
4. Transaction created with type `REFERRAL_REWARD` (for transaction history)
5. Optional: `ReferralEarning` record created (for detailed analytics)

### Sign-up Flow:

1. User signs up with referral code
2. `User.referrerId` is set
3. `Referral` record is created (if not exists)
4. `User.hasReferredOne` is updated for the referrer

## Key Points

✅ **User.referrerId** - Quick lookup, used in business logic
✅ **Referral model** - Detailed relationship tracking
✅ **ReferralEarning model** - Earnings tracking (supports both old and new systems)
✅ **Transaction.REFERRAL_REWARD** - Transaction history for referral rewards

❌ **No redundancy** - Each component has a clear purpose
❌ **No confusion** - Clear comments explain each model's purpose

## Migration Notes

When migrating, ensure:
1. `User.referrerId` matches `Referral.referredId` for existing users
2. `ReferralEarning.planPurchaseId` is added as nullable field
3. Existing `ReferralEarning.stakingId` records remain for old staking system

