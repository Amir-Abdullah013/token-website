# ⚠️ IMPORTANT: Prisma Migration Required

## Quick Fix - Run These Commands:

Since you're using Prisma, you need to push the schema changes to your database.

### Step 1: Push Schema Changes

```bash
npx prisma db push
```

This will:
- ✅ Add `adPoints` column to wallets table
- ✅ Add `AD_INTERACTION` to TransactionType enum
- ✅ Apply changes without creating migration files

### Step 2: Verify Changes

```bash
npx prisma studio
```

Then check the `wallets` table - you should see the new `adPoints` column.

---

## What Was Updated:

### 1. **Wallet Model**
```prisma
model Wallet {
  // ... other fields
  lockedAdPoints Decimal @db.Decimal(30,8) @default(0) // 6-month locked points
  adPoints       Decimal @db.Decimal(30,8) @default(0) // ✅ NEW: Immediately usable
  // ...
}
```

### 2. **TransactionType Enum**
```prisma
enum TransactionType {
  // ... other types
  AD_REWARD
  AD_INTERACTION // ✅ NEW: For page interaction rewards
  PLAN_PURCHASE
  // ...
}
```

---

## After Running `npx prisma db push`:

Everything will work:
- ✅ Automatic interaction rewards (page view, time spent)
- ✅ Main ad rewards (15-second ad watch)
- ✅ Points to USD converter
- ✅ Real-time points tracking
- ✅ No more 500 errors

---

## Alternative: Create a Migration (Production)

If you want to create a proper migration file for production:

```bash
npx prisma migrate dev --name add_ad_points_and_interaction_type
```

This creates a migration file you can commit to version control.

---

## Verification Steps:

1. Run `npx prisma db push`
2. Refresh `/user/ads` page
3. Open browser console (F12)
4. You should see:
   ```
   ✅ Interaction reward: page_view - earned 0.5 points
   ```
5. Check your ad points balance updates automatically

---

## Optional: Migrate Existing Points

If you want to convert existing locked points to immediate points:

```sql
UPDATE wallets 
SET "adPoints" = COALESCE("lockedAdPoints", 0) + COALESCE("adPoints", 0)
WHERE "lockedAdPoints" > 0;
```

Run this in Prisma Studio's SQL console or via `psql`.

---

**Run `npx prisma db push` now to fix everything!** 🚀
