-- Fix referralCode unique constraint issue
-- This migration handles duplicate referralCode values before adding the unique constraint

-- Step 1: Set NULL for any duplicate referralCode values (keeping the first one)
UPDATE users u1
SET "referralCode" = NULL
WHERE u1."referralCode" IS NOT NULL
  AND u1.id NOT IN (
    SELECT DISTINCT ON ("referralCode") id
    FROM users
    WHERE "referralCode" IS NOT NULL
    ORDER BY "referralCode", "createdAt" ASC
  );

-- Step 2: Ensure the unique constraint exists (will be created by Prisma if not exists)
-- The constraint is already defined in schema.prisma as @unique


