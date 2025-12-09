# Fix Prisma ReferralCode Unique Constraint Issue

## Problem 1: Duplicate Values

When running `npx prisma db push`, you get this warning:
```
⚠️  There might be data loss when applying the changes:
  • A unique constraint covering the columns `[referralCode]` on the table `users` will be added. 
    If there are existing duplicate values, this will fail.
```

## Problem 2: Constraint Already Exists

You might also get this error:
```
Error: ERROR: relation "users_referralCode_key" already exists
```

This happens when the constraint exists in the database but Prisma doesn't know about it.

## Solution (Complete Fix)

### Run the Fix Script

This script handles both issues:

```bash
node scripts/fix-prisma-referral-code-constraint.js
```

This script will:
1. ✅ Check if constraint already exists
2. ✅ Fix any duplicate `referralCode` values (keep oldest, set others to NULL)
3. ✅ Drop the existing constraint so Prisma can recreate it properly
4. ✅ Verify everything is ready

### Then Apply Prisma Migration

After running the fix script:

```bash
npx prisma db push
```

(Answer 'y' when prompted - it should work now!)

### Alternative: Manual Fix

If the script doesn't work, fix it manually:

```sql
-- 1. Fix duplicates (keep oldest, remove others)
UPDATE users u1
SET "referralCode" = NULL, "updatedAt" = NOW()
WHERE u1."referralCode" IS NOT NULL
  AND u1.id NOT IN (
    SELECT DISTINCT ON ("referralCode") id
    FROM users
    WHERE "referralCode" IS NOT NULL
    ORDER BY "referralCode", "createdAt" ASC
  );

-- 2. Drop existing constraint if it exists
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS "users_referralCode_key";

-- 3. Verify no duplicates
SELECT "referralCode", COUNT(*) as count
FROM users
WHERE "referralCode" IS NOT NULL
GROUP BY "referralCode"
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

### Alternative: Manual Fix

If the script doesn't work, you can fix it manually:

```sql
-- 1. Find duplicates
SELECT "referralCode", COUNT(*) as count
FROM users
WHERE "referralCode" IS NOT NULL
GROUP BY "referralCode"
HAVING COUNT(*) > 1;

-- 2. Keep the oldest, remove others
UPDATE users u1
SET "referralCode" = NULL, "updatedAt" = NOW()
WHERE u1."referralCode" IS NOT NULL
  AND u1.id NOT IN (
    SELECT DISTINCT ON ("referralCode") id
    FROM users
    WHERE "referralCode" IS NOT NULL
    ORDER BY "referralCode", "createdAt" ASC
  );

-- 3. Verify no duplicates
SELECT "referralCode", COUNT(*) as count
FROM users
WHERE "referralCode" IS NOT NULL
GROUP BY "referralCode"
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

### Step 3: Generate Prisma Client

After successful push:

```bash
npx prisma generate
```

## What Happens to Users with NULL referralCode?

- Users with `NULL` referralCode can still use the system normally
- They just won't have a referral code until one is generated for them
- The system can generate new referral codes for these users if needed

## Summary

1. ✅ Run: `node scripts/fix-referral-code-duplicates.js`
2. ✅ Run: `npx prisma db push` (answer 'y' when prompted)
3. ✅ Run: `npx prisma generate`

Done! 🎉

