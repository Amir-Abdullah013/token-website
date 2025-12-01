-- SQL script to check and fix staking table integer columns
-- This ensures daysRewarded and durationDays are proper integers

-- Check column types
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'staking'
AND column_name IN ('daysRewarded', 'durationDays')
ORDER BY column_name;

-- Find any records with decimal values (if column allows decimals)
SELECT 
    id,
    "daysRewarded",
    "durationDays",
    "userId",
    "createdAt"
FROM staking
WHERE 
    ("daysRewarded"::text LIKE '%.%')
    OR ("durationDays"::text LIKE '%.%')
    OR "daysRewarded" IS NULL
    OR "durationDays" IS NULL
ORDER BY "createdAt" DESC;

-- Fix any decimal values in daysRewarded (convert to integer)
UPDATE staking
SET 
    "daysRewarded" = CASE 
        WHEN "daysRewarded" IS NULL THEN 0
        ELSE GREATEST(0, FLOOR(CAST("daysRewarded" AS NUMERIC)))::INTEGER
    END,
    "durationDays" = CASE 
        WHEN "durationDays" IS NULL THEN 0
        ELSE GREATEST(0, FLOOR(CAST("durationDays" AS NUMERIC)))::INTEGER
    END,
    "updatedAt" = NOW()
WHERE 
    ("daysRewarded"::text LIKE '%.%')
    OR ("durationDays"::text LIKE '%.%')
    OR "daysRewarded" IS NULL
    OR "durationDays" IS NULL;

-- Verify the fix
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN "daysRewarded" = FLOOR("daysRewarded") THEN 1 END) as valid_days_rewarded,
    COUNT(CASE WHEN "durationDays" = FLOOR("durationDays") THEN 1 END) as valid_duration_days,
    MIN("daysRewarded") as min_days_rewarded,
    MAX("daysRewarded") as max_days_rewarded,
    MIN("durationDays") as min_duration_days,
    MAX("durationDays") as max_duration_days
FROM staking;

-- Optional: Alter column type to ensure it's INTEGER (only if needed)
-- Uncomment these if the column type is wrong:
-- ALTER TABLE staking ALTER COLUMN "daysRewarded" TYPE INTEGER USING FLOOR("daysRewarded")::INTEGER;
-- ALTER TABLE staking ALTER COLUMN "durationDays" TYPE INTEGER USING FLOOR("durationDays")::INTEGER;

