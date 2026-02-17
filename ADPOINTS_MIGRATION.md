# Database Migration: Add adPoints Column

## Overview
This migration adds an `adPoints` column to the `wallets` table to store immediately usable ad reward points (replacing the locked points system).

## SQL Migration

Run this SQL in your database:

```sql
-- Add adPoints column to wallets table
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS "adPoints" DECIMAL(30, 8) DEFAULT 0 NOT NULL;

-- Optional: Migrate existing lockedAdPoints to adPoints if you want to convert existing locked points
-- UPDATE wallets 
-- SET "adPoints" = COALESCE("lockedAdPoints", 0) + COALESCE("adPoints", 0);

-- Optional: Reset lockedAdPoints to 0 after migration
-- UPDATE wallets 
-- SET "lockedAdPoints" = 0;
```

## Verification

After running the migration, verify with:

```sql
-- Check that adPoints column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'wallets' AND column_name = 'adPoints';

-- Check current ad points balances
SELECT "userId", "adPoints", "lockedAdPoints", balance 
FROM wallets 
WHERE "adPoints" > 0 OR "lockedAdPoints" > 0
LIMIT 10;
```

## Changes Summary

### What Changed:
1. **New Column**: `adPoints` - Stores immediately usable ad reward points
2. **Reward Logic**: Points are now credited to `adPoints` instead of `lockedAdPoints`
3. **Time Requirement**: Users must watch ads for at least 15 seconds (reduced from 30)
4. **Immediate Availability**: Points are usable right away, no 6-month lock period

### Affected APIs:
- `/api/ads/complete` - Now credits `adPoints` and requires `timeSpent` parameter
- `/api/wallet/balance` - Should return both `adPoints` and existing balance fields
- `/api/ads/converter/*` - New endpoints for points to USD conversion

### Frontend Changes:
- Stats card changed from "Locked Points" to "Ad Points"
- New minimum viewing time: 15 seconds
- New converter section with eligibility requirements
- Updated messaging to reflect immediate availability

##Requirements for Points-to-USD Conversion:
1. User must have referred 5 users
2. Those 5 users must have collectively earned at least 2000 adPoints
3. Conversion rate: 100 points = $1 USD

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove adPoints column
ALTER TABLE wallets DROP COLUMN IF EXISTS "adPoints";
```

Note: This will delete all ad points data. Consider backing up first if needed.
