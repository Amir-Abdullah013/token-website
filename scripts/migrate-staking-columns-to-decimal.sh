#!/bin/bash
# Safe migration script to convert staking and wallet columns to DECIMAL
# This script safely migrates existing data without loss

echo "🔄 Starting migration to convert columns to DECIMAL(30,8)..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it before running this script:"
    echo "  export DATABASE_URL='your-database-url'"
    exit 1
fi

echo "📊 Step 1: Checking current column types..."
psql "$DATABASE_URL" -c "
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name IN ('staking', 'wallets')
AND column_name IN ('rewardAmount', 'dailyRewardAmount', 'rewardAccrued', 'VonBalance', 'stakingTokensAmount')
ORDER BY table_name, column_name;
"

echo ""
echo "📊 Step 2: Checking for existing data..."
psql "$DATABASE_URL" -c "
SELECT 
    (SELECT COUNT(*) FROM staking) as staking_count,
    (SELECT COUNT(*) FROM wallets) as wallet_count,
    (SELECT COUNT(*) FROM staking WHERE \"rewardAmount\" IS NOT NULL) as staking_with_rewards,
    (SELECT COUNT(*) FROM wallets WHERE \"VonBalance\" IS NOT NULL) as wallets_with_balance;
"

echo ""
read -p "⚠️  Do you want to proceed with the migration? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migration cancelled by user"
    exit 0
fi

echo ""
echo "🔄 Step 3: Creating backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

echo ""
echo "🔄 Step 4: Running migration..."

# Run the migration SQL
psql "$DATABASE_URL" -f prisma/migrations/20250217000000_convert_staking_reward_columns_to_decimal/migration.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed! Restore from backup: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "📊 Step 5: Verifying migration..."
psql "$DATABASE_URL" -c "
SELECT 
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name IN ('staking', 'wallets')
AND column_name IN ('rewardAmount', 'dailyRewardAmount', 'rewardAccrued', 'VonBalance', 'stakingTokensAmount')
ORDER BY table_name, column_name;
"

echo ""
echo "✅ Migration verification complete!"
echo "💾 Backup file: $BACKUP_FILE"
echo ""
echo "📝 Next steps:"
echo "1. Run Prisma generate: npx prisma generate"
echo "2. Test the cron endpoint to verify decimal values work"
echo "3. Monitor logs for any issues"

