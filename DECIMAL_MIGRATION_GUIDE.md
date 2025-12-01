# Complete Guide: Converting Staking Reward Columns to DECIMAL

## Overview

This guide provides a complete solution for converting integer/float columns to DECIMAL(30,8) to support fractional reward amounts like `0.0547945205479452` or `17.519178082191782`.

## Problem

The database columns `rewardAmount`, `dailyRewardAmount`, `rewardAccrued` in the `staking` table, and `VonBalance`, `stakingTokensAmount` in the `wallets` table need to store precise decimal values for fractional rewards, but they're currently INT or FLOAT types that don't support the required precision.

## Solution

### Step 1: Verify Prisma Schema

The Prisma schema already defines these columns as `Decimal @db.Decimal(30,8)`, which is correct:

```prisma
model Staking {
  rewardAmount      Decimal @default(0) @db.Decimal(30, 8)
  dailyRewardAmount Decimal @default(0) @db.Decimal(30, 8)
  rewardAccrued     Decimal @default(0) @db.Decimal(30, 8)
  // ...
}

model Wallet {
  VonBalance         Decimal @db.Decimal(30,8)
  stakingTokensAmount Decimal @db.Decimal(30,8)
  // ...
}
```

### Step 2: Run Database Migration

**Option A: Using Prisma Migrate (Recommended)**

```bash
# Generate Prisma client with new types
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name convert_staking_reward_columns_to_decimal
```

**Option B: Manual SQL Migration (For Production)**

1. **Create a backup first:**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run the migration script:**
   ```bash
   # Make script executable
   chmod +x scripts/migrate-staking-columns-to-decimal.sh
   
   # Run migration
   ./scripts/migrate-staking-columns-to-decimal.sh
   ```

   Or run SQL directly:
   ```bash
   psql $DATABASE_URL -f prisma/migrations/20250217000000_convert_staking_reward_columns_to_decimal/migration.sql
   ```

### Step 3: Verify Migration

Run this SQL query to verify all columns are now DECIMAL(30,8):

```sql
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name IN ('staking', 'wallets')
AND column_name IN ('rewardAmount', 'dailyRewardAmount', 'rewardAccrued', 'VonBalance', 'stakingTokensAmount')
ORDER BY table_name, column_name;
```

Expected result:
- `data_type` should be `numeric`
- `numeric_precision` should be `30`
- `numeric_scale` should be `8`

### Step 4: Code Changes Applied

The code has been updated to:

1. **Convert Decimal values to strings** before SQL queries to preserve precision
2. **Use explicit CAST in SQL** (`::DECIMAL(30,8)`) for safety
3. **Handle Prisma Decimal objects** correctly

Key changes in `src/app/api/cron/process-stakings/route.js`:

```javascript
// Convert to strings for PostgreSQL DECIMAL columns
const totalRewardForPeriodStr = String(totalRewardForPeriod);
const dailyRewardStr = String(dailyReward);
const newRewardAccruedStr = String(newRewardAccrued);
const rewardIncrementStr = String(rewardIncrement);

// Use explicit casting in SQL
await client.query(`
  UPDATE staking 
  SET "rewardAccrued" = $1::DECIMAL(30,8),
      "rewardAmount" = $2::DECIMAL(30,8)
  WHERE id = $3
`, [newRewardAccruedStr, totalRewardForPeriodStr, staking.id]);
```

### Step 5: Test the Fix

1. **Test the cron endpoint:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://pryvons.com/api/cron/process-stakings
   ```

2. **Verify no errors:**
   - Should see `"success": true`
   - No "invalid input syntax" errors
   - `totalProcessed` > 0

3. **Check database values:**
   ```sql
   SELECT 
       id,
       "rewardAmount",
       "dailyRewardAmount",
       "rewardAccrued"
   FROM staking
   WHERE status = 'ACTIVE'
   LIMIT 5;
   ```

4. **Verify fractional values are stored:**
   ```sql
   SELECT 
       "userId",
       "VonBalance",
       "stakingTokensAmount"
   FROM wallets
   WHERE "VonBalance" != FLOOR("VonBalance")
   LIMIT 5;
   ```

## Migration Safety

### Backup
- ✅ Always backup before migration
- ✅ Test on staging first if possible

### Data Preservation
- ✅ Migration uses `USING` clause to safely convert existing values
- ✅ NULL values are handled (defaulted to 0)
- ✅ Existing integer values convert cleanly to DECIMAL

### Rollback Plan

If migration fails, restore from backup:
```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## Troubleshooting

### Issue: "column does not exist"
**Solution:** Check table names - PostgreSQL is case-sensitive. Use quotes: `"rewardAmount"` not `rewardAmount`.

### Issue: "value too long for type"
**Solution:** DECIMAL(30,8) can store up to 22 digits before decimal point. If you need more, adjust to DECIMAL(50,18).

### Issue: Precision loss
**Solution:** Ensure values are passed as strings, not numbers, when using in SQL queries with DECIMAL columns.

### Issue: Prisma client not updated
**Solution:** Run `npx prisma generate` after migration to update the Prisma client types.

## Expected Behavior After Fix

✅ Fractional rewards like `0.0547945205479452` can be stored  
✅ Daily rewards like `17.519178082191782` process correctly  
✅ No "invalid input syntax for type integer" errors  
✅ Precise decimal calculations maintained  
✅ Reserve history entries created successfully  

## Files Modified

1. `prisma/migrations/20250217000000_convert_staking_reward_columns_to_decimal/migration.sql` - Migration SQL
2. `scripts/migrate-staking-columns-to-decimal.sh` - Migration script with safety checks
3. `src/app/api/cron/process-stakings/route.js` - Code updates for Decimal handling
4. `DECIMAL_MIGRATION_GUIDE.md` - This guide

## Support

If you encounter issues:
1. Check database column types match Prisma schema
2. Verify Prisma client is regenerated
3. Check that values are passed as strings to SQL
4. Review migration logs for errors

