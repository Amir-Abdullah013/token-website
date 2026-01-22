-- Fix referralCode constraint issue
-- This script safely handles the existing constraint

-- Check and handle the referralCode unique constraint
DO $$
BEGIN
    -- Check if constraint exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
          AND constraint_name = 'users_referralCode_key'
          AND constraint_type = 'UNIQUE'
    ) THEN
        -- Create the constraint if it doesn't exist
        ALTER TABLE users 
        ADD CONSTRAINT "users_referralCode_key" UNIQUE ("referralCode");
        RAISE NOTICE 'Constraint users_referralCode_key created';
    ELSE
        RAISE NOTICE 'Constraint users_referralCode_key already exists - skipping';
    END IF;
END $$;

-- Ensure referralCode column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name = 'referralCode'
    ) THEN
        ALTER TABLE users ADD COLUMN "referralCode" TEXT;
        RAISE NOTICE 'Column referralCode added';
    ELSE
        RAISE NOTICE 'Column referralCode already exists';
    END IF;
END $$;

-- Verify all referral-related columns exist
DO $$
BEGIN
    -- Check referrerId
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'referrerId'
    ) THEN
        ALTER TABLE users ADD COLUMN "referrerId" TEXT;
        RAISE NOTICE 'Column referrerId added';
    END IF;

    -- Check hasReferredOne
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'hasReferredOne'
    ) THEN
        ALTER TABLE users ADD COLUMN "hasReferredOne" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Column hasReferredOne added';
    END IF;
END $$;

-- Verify plan purchase system columns
DO $$
BEGIN
    -- Check lockedPlanTokensAmount in wallets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'lockedPlanTokensAmount'
    ) THEN
        ALTER TABLE wallets ADD COLUMN "lockedPlanTokensAmount" DECIMAL(30,8) DEFAULT 0;
        RAISE NOTICE 'Column lockedPlanTokensAmount added to wallets';
    END IF;
END $$;

-- Check if plan_purchases table exists, if not provide creation script
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'plan_purchases'
        ) THEN 'Table plan_purchases exists'
        ELSE 'Table plan_purchases does not exist - will be created by Prisma migration'
    END AS plan_purchases_status;

-- Check if referral_earnings has planPurchaseId column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'referral_earnings'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'referral_earnings' 
              AND column_name = 'planPurchaseId'
        ) THEN
            ALTER TABLE referral_earnings 
            ADD COLUMN "planPurchaseId" TEXT;
            RAISE NOTICE 'Column planPurchaseId added to referral_earnings';
        END IF;
    END IF;
END $$;

SELECT 'All checks completed successfully!' AS status;

