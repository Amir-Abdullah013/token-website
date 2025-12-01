# Quick Start: Fix Decimal Reward Columns

## 🎯 Problem
Error: `"invalid input syntax for type integer: '17.519178082191782'"`

The database columns are INT but need to store fractional decimal values.

## ✅ Solution Summary

### 1. Prisma Schema (Already Correct)
✅ Your Prisma schema already has the correct types:
```prisma
model Staking {
  rewardAmount      Decimal @db.Decimal(30, 8)
  dailyRewardAmount Decimal @db.Decimal(30, 8)
  rewardAccrued     Decimal @db.Decimal(30, 8)
}

model Wallet {
  VonBalance         Decimal @db.Decimal(30,8)
  stakingTokensAmount Decimal @db.Decimal(30,8)
}
```

### 2. Database Migration (REQUIRED)

**Run this on your VPS:**

```bash
# 1. Backup database first
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migration
psql $DATABASE_URL -f prisma/migrations/20250217000000_convert_staking_reward_columns_to_decimal/migration.sql

# 3. Regenerate Prisma client
npx prisma generate
```

### 3. Code Changes (Already Applied)
✅ Code has been updated to:
- Convert Decimal values to strings before SQL
- Use explicit `::DECIMAL(30,8)` casting
- Handle fractional values correctly

## 🚀 Testing

```bash
# Test the cron endpoint
curl -H "Authorization: Bearer jfn39s8s2K_sT1X!" https://pryvons.com/api/cron/process-stakings
```

**Expected:**
- ✅ No "invalid input syntax" errors
- ✅ `totalProcessed` > 0
- ✅ Fractional rewards stored correctly

## 📋 Migration Checklist

- [ ] Backup database
- [ ] Run migration SQL
- [ ] Regenerate Prisma client (`npx prisma generate`)
- [ ] Deploy code changes
- [ ] Test cron endpoint
- [ ] Verify reserve history entries appear
- [ ] Check database values are DECIMAL

## 🔍 Verify Migration

```sql
-- Check column types
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name IN ('staking', 'wallets')
AND column_name IN ('rewardAmount', 'dailyRewardAmount', 'rewardAccrued', 'VonBalance', 'stakingTokensAmount');

-- Should show: data_type='numeric', precision=30, scale=8
```

## 📁 Files Changed

1. `src/app/api/cron/process-stakings/route.js` - Decimal handling
2. `prisma/migrations/20250217000000_convert_staking_reward_columns_to_decimal/migration.sql` - Database migration
3. `scripts/migrate-staking-columns-to-decimal.sh` - Migration script

## 🆘 Rollback

If migration fails:
```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## 📚 Full Documentation

See `DECIMAL_MIGRATION_GUIDE.md` for complete details.

