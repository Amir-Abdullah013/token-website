-- Add new tracking columns for daily staking rewards
ALTER TABLE staking
  ADD COLUMN "dailyRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "rewardAccrued" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "daysRewarded" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastRewardDate" TIMESTAMP,
  ADD COLUMN "nextRewardDate" TIMESTAMP;

-- Ensure rewardAmount is populated for legacy rows
UPDATE staking
SET "rewardAmount" = COALESCE(
      NULLIF("rewardAmount", 0),
      ("amountStaked" * "rewardPercent") / 100.0
    );

-- Backfill daily reward value and next payout date
UPDATE staking
SET "dailyRewardAmount" = CASE 
      WHEN COALESCE("durationDays", 0) > 0 THEN "rewardAmount" / NULLIF("durationDays", 0)
      ELSE 0
    END,
    "nextRewardDate" = CASE
      WHEN status = 'ACTIVE' THEN "startDate" + INTERVAL '1 day'
      ELSE NULL
    END;

-- Align defaults to match schema
ALTER TABLE staking
  ALTER COLUMN "rewardAmount" SET DEFAULT 0,
  ALTER COLUMN "rewardAmount" SET NOT NULL;


