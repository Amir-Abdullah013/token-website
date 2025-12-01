-- Migration: Convert staking reward columns and wallet columns to DECIMAL for precise fractional values
-- This migration safely converts existing integer/float columns to DECIMAL(30,8) without data loss

-- ==========================================
-- 1. STAKING TABLE - Reward Amount Columns
-- ==========================================

-- Convert rewardAmount to DECIMAL(30,8) if not already
ALTER TABLE staking 
ALTER COLUMN "rewardAmount" TYPE DECIMAL(30,8) 
USING CASE 
  WHEN "rewardAmount" IS NULL THEN 0::DECIMAL(30,8)
  ELSE CAST("rewardAmount" AS DECIMAL(30,8))
END;

-- Set default value
ALTER TABLE staking 
ALTER COLUMN "rewardAmount" SET DEFAULT 0;

-- Convert dailyRewardAmount to DECIMAL(30,8) if not already
ALTER TABLE staking 
ALTER COLUMN "dailyRewardAmount" TYPE DECIMAL(30,8) 
USING CASE 
  WHEN "dailyRewardAmount" IS NULL THEN 0::DECIMAL(30,8)
  ELSE CAST("dailyRewardAmount" AS DECIMAL(30,8))
END;

-- Set default value
ALTER TABLE staking 
ALTER COLUMN "dailyRewardAmount" SET DEFAULT 0;

-- Convert rewardAccrued to DECIMAL(30,8) if not already
ALTER TABLE staking 
ALTER COLUMN "rewardAccrued" TYPE DECIMAL(30,8) 
USING CASE 
  WHEN "rewardAccrued" IS NULL THEN 0::DECIMAL(30,8)
  ELSE CAST("rewardAccrued" AS DECIMAL(30,8))
END;

-- Set default value
ALTER TABLE staking 
ALTER COLUMN "rewardAccrued" SET DEFAULT 0;

-- ==========================================
-- 2. WALLETS TABLE - Balance Columns
-- ==========================================

-- Convert VonBalance to DECIMAL(30,8) if not already
ALTER TABLE wallets 
ALTER COLUMN "VonBalance" TYPE DECIMAL(30,8) 
USING CASE 
  WHEN "VonBalance" IS NULL THEN 0::DECIMAL(30,8)
  ELSE CAST("VonBalance" AS DECIMAL(30,8))
END;

-- Set default value
ALTER TABLE wallets 
ALTER COLUMN "VonBalance" SET DEFAULT 0;

-- Convert stakingTokensAmount to DECIMAL(30,8) if not already
ALTER TABLE wallets 
ALTER COLUMN "stakingTokensAmount" TYPE DECIMAL(30,8) 
USING CASE 
  WHEN "stakingTokensAmount" IS NULL THEN 0::DECIMAL(30,8)
  ELSE CAST("stakingTokensAmount" AS DECIMAL(30,8))
END;

-- Set default value
ALTER TABLE wallets 
ALTER COLUMN "stakingTokensAmount" SET DEFAULT 0;

-- ==========================================
-- 3. VERIFICATION QUERIES (for manual checking)
-- ==========================================

-- Verify column types
-- SELECT 
--     table_name,
--     column_name,
--     data_type,
--     numeric_precision,
--     numeric_scale
-- FROM information_schema.columns
-- WHERE table_name IN ('staking', 'wallets')
-- AND column_name IN ('rewardAmount', 'dailyRewardAmount', 'rewardAccrued', 'VonBalance', 'stakingTokensAmount')
-- ORDER BY table_name, column_name;

-- Verify data integrity
-- SELECT 
--     COUNT(*) as total_stakings,
--     COUNT(CASE WHEN "rewardAmount" IS NOT NULL THEN 1 END) as has_reward_amount,
--     COUNT(CASE WHEN "dailyRewardAmount" IS NOT NULL THEN 1 END) as has_daily_reward,
--     COUNT(CASE WHEN "rewardAccrued" IS NOT NULL THEN 1 END) as has_reward_accrued
-- FROM staking;

-- SELECT 
--     COUNT(*) as total_wallets,
--     COUNT(CASE WHEN "VonBalance" IS NOT NULL THEN 1 END) as has_von_balance,
--     COUNT(CASE WHEN "stakingTokensAmount" IS NOT NULL THEN 1 END) as has_staking_tokens
-- FROM wallets;

