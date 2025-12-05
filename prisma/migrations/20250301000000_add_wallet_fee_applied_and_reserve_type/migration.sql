-- Migration: Add walletFeeApplied field and WALLET_FEE to AdminReserveType enum
-- Adds walletFeeApplied boolean field to users table
-- Adds WALLET_FEE value to AdminReserveType enum

-- Add walletFeeApplied field
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "walletFeeApplied" BOOLEAN DEFAULT false;

-- Add WALLET_FEE to AdminReserveType enum
-- Note: PostgreSQL doesn't support adding enum values directly, so we use ALTER TYPE
DO $$ BEGIN
    ALTER TYPE "AdminReserveType" ADD VALUE IF NOT EXISTS 'WALLET_FEE';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


