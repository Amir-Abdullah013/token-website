# Quick Fix for Prisma Constraint Error

## Error
```
Error: ERROR: relation "users_referralCode_key" already exists
```

## Solution (Choose One)

### Option 1: Run the Fix Script (Recommended)
```bash
node scripts/fix-prisma-referral-code-constraint.js
```

Then:
```bash
npx prisma db push
```

### Option 2: Run SQL Directly 

If the script doesn't work, run this SQL directly in your database:

**Via Supabase SQL Editor:**
1. Go to your Supabase project
2. Open SQL Editor
3. Paste and run the SQL from `FIX_PRISMA_CONSTRAINT_SQL.sql`

**Via psql:**
```bash
psql $DATABASE_URL -f FIX_PRISMA_CONSTRAINT_SQL.sql
```

**Or manually:**
```sql
-- Drop the constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_referralCode_key";
```

Then:
```bash
npx prisma db push
```

### Option 3: Use Prisma Migrate Instead

If `db push` keeps having issues, use migrations:

```bash
# Create a migration
npx prisma migrate dev --name fix_referral_code_constraint

# This will create a migration file you can edit if needed
```

## What the Fix Does

1. ✅ Fixes any duplicate `referralCode` values
2. ✅ Drops the existing constraint
3. ✅ Allows Prisma to recreate it properly

## After Fixing

```bash
npx prisma db push
# or
npx prisma migrate deploy
```

Then:
```bash
npx prisma generate
```

Done! 🎉



