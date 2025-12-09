# Fix Prisma db push Issues

## Problem

When running `npx prisma db push`, you get errors like:
- `ERROR: relation "users_referralCode_key" already exists`
- Shadow database errors with migrations

## Solution

### Step 1: Run the Fix Script

```bash
node scripts/fix-prisma-db-push.js
```

This will:
- ✅ Fix duplicate referralCode values
- ✅ Drop existing constraints
- ✅ Prepare database for Prisma

### Step 2: Use `db push` (Not `migrate dev`)

For fixing constraints, use `db push` instead of `migrate dev`:

```bash
npx prisma db push
```

**Why?** 
- `db push` doesn't use shadow database (avoids migration errors)
- `db push` directly syncs schema to database
- Perfect for constraint fixes

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

## Alternative: If DIRECT_URL is Missing

If you get shadow database errors, you might need to set `DIRECT_URL`:

1. **Check your .env.local file:**
   ```bash
   # Should have both:
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...  # Same as DATABASE_URL but without pooling
   ```

2. **If DIRECT_URL is missing, run:**
   ```bash
   node scripts/setup-database-connection.js
   ```

3. **Or manually add to .env.local:**
   ```
   DIRECT_URL=your_database_url_without_pooling
   ```

## Quick Fix Summary

```bash
# 1. Fix database issues
node scripts/fix-prisma-db-push.js

# 2. Push schema (use db push, not migrate)
npx prisma db push

# 3. Generate client
npx prisma generate
```

## When to Use `db push` vs `migrate dev`

- **Use `db push`**: For quick schema changes, constraint fixes, development
- **Use `migrate dev`**: For production migrations, version control, team collaboration

For this constraint fix, **`db push` is the right choice**.



