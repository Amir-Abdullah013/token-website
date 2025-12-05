#!/bin/bash

# Wallet Fee Processing Cron Script
# This script processes all due wallet fees for users whose 30-day trial has ended
# Runs daily via cron job

# Configuration
CRON_SECRET="${CRON_SECRET:-jfn39s8s2K_sT1X!}"
BASE_URL="${NEXT_PUBLIC_BASE_URL:-https://pryvons.com}"
ENDPOINT="/api/cron/process-wallet-fees"
URL="${BASE_URL}${ENDPOINT}"

# Logging
LOG_DIR="$(dirname "$0")/../logs"
LOG_FILE="${LOG_DIR}/wallet-fees-cron.log"
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start processing
log "========================================="
log "Starting wallet fee processing cron job"
log "URL: $URL"
log "========================================="

# Execute the cron job
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $CRON_SECRET" "$URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Log results
if [ "$HTTP_CODE" -eq 200 ]; then
    log "✅ SUCCESS: Wallet fee processing completed"
    log "Response: $BODY"
else
    log "❌ ERROR: Wallet fee processing failed (HTTP $HTTP_CODE)"
    log "Response: $BODY"
    exit 1
fi

log "========================================="
log "Wallet fee processing cron job completed"
log "========================================="
log ""

