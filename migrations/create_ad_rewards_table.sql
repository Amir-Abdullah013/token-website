-- Ad Rewards Table Migration
-- Run this SQL in your database to create the ad_rewards table

CREATE TABLE IF NOT EXISTS ad_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward DECIMAL(30,8) NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  "adTransactionId" TEXT, -- AdMaven transaction ID for verification
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_ad_rewards_user_date ON ad_rewards("userId", "createdAt");

-- Create index for transaction ID lookups (prevent duplicates)
CREATE INDEX IF NOT EXISTS idx_ad_rewards_transaction ON ad_rewards("adTransactionId");
