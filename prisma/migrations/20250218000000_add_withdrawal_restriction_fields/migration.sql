-- Migration: Add withdrawal restriction fields to users table
-- Adds firstDepositAmount, hasReferredOne, and referralCode fields

-- Add firstDepositAmount field
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "firstDepositAmount" FLOAT;

-- Add hasReferredOne field
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "hasReferredOne" BOOLEAN DEFAULT false;

-- Add referralCode field (unique)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- Create unique index on referralCode
CREATE UNIQUE INDEX IF NOT EXISTS "users_referralCode_key" ON users("referralCode") WHERE "referralCode" IS NOT NULL;

-- Generate referral codes for existing users (use their ID as referral code)
UPDATE users 
SET "referralCode" = id 
WHERE "referralCode" IS NULL;


