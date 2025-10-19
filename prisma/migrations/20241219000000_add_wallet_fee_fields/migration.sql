-- Add wallet fee fields to User table
ALTER TABLE "users" ADD COLUMN "walletFeeDueAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "walletFeeProcessed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "walletFeeWaived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "walletFeeProcessedAt" TIMESTAMP(3);

-- Add indexes for performance
CREATE INDEX "users_walletFeeDueAt_idx" ON "users"("walletFeeDueAt");
CREATE INDEX "users_walletFeeProcessed_idx" ON "users"("walletFeeProcessed");


