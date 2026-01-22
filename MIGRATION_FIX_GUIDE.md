# Migration Fix Guide - ReferralCode Constraint Issue

## Problem
The error `relation "users_referralCode_key" already exists` occurs because the unique constraint already exists in the database, but Prisma is trying to create it again.

## Solution Options

### Option 1: Use `prisma db push` (Recommended - Safest)
This command syncs your schema with the database without creating migration files and handles existing constraints gracefully:

```bash
npx prisma db push
```

This will:
- ✅ Skip creating constraints that already exist
- ✅ Add missing columns/tables
- ✅ Not affect existing referral or plan logic
- ✅ Update the database schema safely

### Option 2: Mark Migration as Applied
If you're using migrations and the constraint already exists, mark the migration as applied:

```bash
# First, find the migration name
ls prisma/migrations

# Then mark it as applied (replace <migration_name> with actual name)
npx prisma migrate resolve --applied <migration_name>
```

### Option 3: Run SQL Script Directly
Run the SQL script to ensure everything is in place:

```bash
# Using psql
psql $DATABASE_URL -f scripts/fix-constraint-issue.sql

# Or using any PostgreSQL client
# Copy and paste the contents of scripts/fix-constraint-issue.sql
```

### Option 4: Manual Fix (If needed)
If the above don't work, you can manually ensure the constraint exists:

```sql
-- Check if constraint exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
  AND constraint_name = 'users_referralCode_key';

-- If it exists, you're good!
-- If not, create it:
ALTER TABLE users 
ADD CONSTRAINT "users_referralCode_key" UNIQUE ("referralCode");
```

## Verification

After running any of the above, verify everything is correct:

```bash
# Generate Prisma Client
npx prisma generate

# Verify schema is in sync
npx prisma validate
```

## What This Fix Does

✅ **Preserves Referral Logic**:
- `referrerId` column remains intact
- `referralCode` unique constraint is handled safely
- `hasReferredOne` column is preserved
- All referral relationships remain unchanged

✅ **Preserves Plan Purchase Logic**:
- `lockedPlanTokensAmount` column is added if missing
- `plan_purchases` table will be created by migration
- `planPurchaseId` in `referral_earnings` is added if missing

✅ **No Data Loss**:
- All existing data remains intact
- Only adds missing columns/constraints
- Does not modify existing data

## Next Steps

1. Run `npx prisma db push` (recommended)
2. Verify with `npx prisma generate`
3. Test the application to ensure referral and plan logic work correctly

