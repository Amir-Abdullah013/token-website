-- Migration: Add user supply split and admin reserve to token_supply
-- This migration adds the new supply-based economy fields

-- Add new columns to token_supply table
ALTER TABLE token_supply 
ADD COLUMN IF NOT EXISTS "userSupplyRemaining" BIGINT DEFAULT 2000000,
ADD COLUMN IF NOT EXISTS "adminReserve" BIGINT DEFAULT 8000000;

-- Update existing records to split the supply (20% user, 80% admin)
UPDATE token_supply 
SET 
  "userSupplyRemaining" = CAST("totalSupply" * 0.20 AS BIGINT),
  "adminReserve" = CAST("totalSupply" * 0.80 AS BIGINT),
  "updatedAt" = NOW()
WHERE "userSupplyRemaining" IS NULL OR "adminReserve" IS NULL;

-- Create admin_supply_transfers table for tracking admin token releases
CREATE TABLE IF NOT EXISTS admin_supply_transfers (
  id TEXT PRIMARY KEY,
  "adminId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tokenSupplyId" INTEGER NOT NULL REFERENCES token_supply(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  "fromReserve" BIGINT NOT NULL,
  "toUserSupply" BIGINT NOT NULL,
  reason TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS admin_supply_transfers_admin_id_idx ON admin_supply_transfers("adminId");
CREATE INDEX IF NOT EXISTS admin_supply_transfers_created_at_idx ON admin_supply_transfers("createdAt");

-- Add comment for documentation
COMMENT ON COLUMN token_supply."userSupplyRemaining" IS '20% of total supply available for user activities (staking, referrals, buying)';
COMMENT ON COLUMN token_supply."adminReserve" IS '80% of total supply locked under admin control';
COMMENT ON TABLE admin_supply_transfers IS 'Tracks admin transfers from reserve to user supply';



