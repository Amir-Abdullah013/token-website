-- Add walletFeeLocked field to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "walletFeeLocked" BOOLEAN NOT NULL DEFAULT false;

-- Create index for wallet fee queries
CREATE INDEX IF NOT EXISTS "idx_users_wallet_fee_due" ON "users"("walletFeeDueAt") WHERE "walletFeeProcessed" = false;
CREATE INDEX IF NOT EXISTS "idx_users_wallet_fee_locked" ON "users"("walletFeeLocked") WHERE "walletFeeLocked" = true;











