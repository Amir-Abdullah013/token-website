-- Add stakingTokensAmount field to wallets table
-- This field stores staked tokens locked in the user's account
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS "stakingTokensAmount" DOUBLE PRECISION DEFAULT 0;

-- Update existing wallets to have 0 stakingTokensAmount if null
UPDATE wallets 
SET "stakingTokensAmount" = 0 
WHERE "stakingTokensAmount" IS NULL;

