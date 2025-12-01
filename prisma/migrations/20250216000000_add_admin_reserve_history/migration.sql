-- Create AdminReserveType enum
DO $$ BEGIN
    CREATE TYPE "AdminReserveType" AS ENUM ('ADD', 'REMOVE', 'TRANSFER_OUT', 'STAKING_REWARD', 'MANUAL_ADJUST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create admin_reserve_history table
CREATE TABLE IF NOT EXISTS "admin_reserve_history" (
    "id" TEXT NOT NULL,
    "transactionType" "AdminReserveType" NOT NULL,
    "amount" DECIMAL(15, 2) NOT NULL,
    "purpose" TEXT,
    "userId" TEXT,
    "adminId" TEXT NOT NULL,
    "reserveBefore" DECIMAL(15, 2) NOT NULL,
    "reserveAfter" DECIMAL(15, 2) NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_reserve_history_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "admin_reserve_history_transactionType_idx" ON "admin_reserve_history"("transactionType");
CREATE INDEX IF NOT EXISTS "admin_reserve_history_createdAt_idx" ON "admin_reserve_history"("createdAt");
CREATE INDEX IF NOT EXISTS "admin_reserve_history_userId_idx" ON "admin_reserve_history"("userId");
CREATE INDEX IF NOT EXISTS "admin_reserve_history_adminId_idx" ON "admin_reserve_history"("adminId");

-- Add foreign key constraints
ALTER TABLE "admin_reserve_history" ADD CONSTRAINT "admin_reserve_history_adminId_fkey" 
    FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_reserve_history" ADD CONSTRAINT "admin_reserve_history_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


