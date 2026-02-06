# Database Migration Guide for Ad Rewards

## Step 1: Generate Prisma Client

Run this command to generate the Prisma client with the new AdReward model:

```bash
npx prisma generate
```

## Step 2: Create Migration

Create a new migration for the ad_rewards table:

```bash
npx prisma migrate dev --name add_ad_rewards
```

This will:
- Create the `ad_rewards` table in your database
- Add the `AD_REWARD` enum value to `TransactionType`
- Add the `AdRewardStatus` enum
- Create necessary indexes

## Step 3: Verify Migration

Check that the table was created successfully:

```bash
npx prisma studio
```

Then navigate to the `ad_rewards` table to verify it exists.

## Manual SQL (If needed)

If you prefer to run the SQL manually, here's the equivalent:

```sql
-- Create AdRewardStatus enum
CREATE TYPE "AdRewardStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- Create ad_rewards table
CREATE TABLE "ad_rewards" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "reward" DECIMAL(30,8) NOT NULL DEFAULT 10,
  "status" "AdRewardStatus" NOT NULL DEFAULT 'COMPLETED',
  "adTransactionId" TEXT,
  "adProvider" TEXT NOT NULL DEFAULT 'AdMaven',
  "adType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ad_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX "ad_rewards_userId_createdAt_idx" ON "ad_rewards"("userId", "createdAt");
CREATE UNIQUE INDEX "ad_rewards_adTransactionId_key" ON "ad_rewards"("adTransactionId");

-- Add AD_REWARD to TransactionType enum
ALTER TYPE "TransactionType" ADD VALUE 'AD_REWARD';
```

## What's Been Added

### Schema Changes:
1. **AdReward Model** - Tracks all ad viewing rewards
   - `id`: Unique identifier
   - `userId`: Reference to user who earned the reward
   - `reward`: Amount of VON tokens earned (default 10)
   - `status`: PENDING, COMPLETED, or FAILED
   - `adTransactionId`: AdMaven transaction ID (for verification)
   - `adProvider`: Ad network name (default "AdMaven")
   - `adType`: Type of ad (video, banner, etc.)
   - `createdAt`: When the reward was earned
   - `updatedAt`: Last update timestamp

2. **TransactionType Enum** - Added `AD_REWARD` value

3. **User Model** - Added `adRewards` relation

### Indexes:
- Composite index on `(userId, createdAt)` for fast user history queries
- Unique index on `adTransactionId` to prevent duplicate rewards

## Testing the Migration

After running the migration, test with:

```javascript
// Test creating an ad reward
const reward = await prisma.adReward.create({
  data: {
    userId: 'user_id_here',
    reward: 10,
    status: 'COMPLETED',
    adProvider: 'AdMaven'
  }
});

console.log('Created reward:', reward);
```

## Rollback (If needed)

If you need to rollback:

```bash
npx prisma migrate reset
```

**Warning**: This will delete all data in your database!
