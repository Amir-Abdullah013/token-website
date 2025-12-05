# Wallet Fee Cron Setup Guide

## Problem: Unauthorized Error

If you're getting `{"error":"Unauthorized"}` when calling the wallet fee cron endpoint, it means the `CRON_SECRET` environment variable doesn't match your authorization token.

## Solution

### Step 1: Set CRON_SECRET Environment Variable

On your VPS, you need to set the `CRON_SECRET` environment variable to match your token.

**Option A: Using .env.local file (Recommended for Next.js)**

```bash
# Navigate to your project directory
cd /var/www/token-website

# Edit or create .env.local file
nano .env.local

# Add this line (replace with your actual secret):
CRON_SECRET=jfn39s8s2K_sT1X!

# Save and exit (Ctrl+X, then Y, then Enter)
```

**Option B: Export in shell session**

```bash
export CRON_SECRET=jfn39s8s2K_sT1X!
```

**Option C: Add to systemd service or PM2 ecosystem (if using PM2)**

If you're running your Next.js app with PM2 or systemd, add the environment variable there.

### Step 2: Restart Your Application

After setting the environment variable, restart your Next.js application:

```bash
# If using PM2
pm2 restart all

# If using systemd
sudo systemctl restart your-app-name

# If using npm/node directly
# Stop and restart your process
```

### Step 3: Test the Endpoint

```bash
curl -H "Authorization: Bearer jfn39s8s2K_sT1X!" https://pryvons.com/api/cron/process-wallet-fees
```

You should now get a successful response instead of "Unauthorized".

## Understanding Wallet Fee Processing

### Two Types of Wallet Fee Processing:

1. **Automatic Processing After Deposit** (NOT a cron job)
   - This happens automatically when an admin approves a deposit
   - Triggered in: `src/app/api/admin/deposits/[id]/route.js`
   - Function: `processWalletFeeAfterDeposit()`
   - **No cron needed** - it's event-driven

2. **Batch Processing Cron Job** (Daily cron)
   - Processes all users whose 30-day trial period has ended
   - Runs daily to catch any users who haven't had their fee processed yet
   - Endpoint: `/api/cron/process-wallet-fees`

## Setting Up the Cron Job on VPS

### Step 1: Create a Cron Script

Create a script that calls your endpoint:

```bash
# Create the script
nano /var/www/token-website/scripts/cron-wallet-fees.sh
```

Add this content:

```bash
#!/bin/bash

# Wallet Fee Processing Cron Script
# Runs daily at 2:00 AM

CRON_SECRET="jfn39s8s2K_sT1X!"
URL="https://pryvons.com/api/cron/process-wallet-fees"
LOG_FILE="/var/www/token-website/logs/wallet-fees-cron.log"

# Create logs directory if it doesn't exist
mkdir -p /var/www/token-website/logs

# Execute the cron job
echo "$(date): Starting wallet fee processing..." >> "$LOG_FILE"
curl -H "Authorization: Bearer $CRON_SECRET" "$URL" >> "$LOG_FILE" 2>&1
echo "$(date): Wallet fee processing completed" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
```

Make it executable:

```bash
chmod +x /var/www/token-website/scripts/cron-wallet-fees.sh
```

### Step 2: Add to Crontab

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2:00 AM:
0 2 * * * /var/www/token-website/scripts/cron-wallet-fees.sh

# Or run every 6 hours:
0 */6 * * * /var/www/token-website/scripts/cron-wallet-fees.sh

# Or run every hour (for testing):
0 * * * * /var/www/token-website/scripts/cron-wallet-fees.sh
```

### Step 3: Verify Cron is Running

```bash
# Check if cron is running
systemctl status cron

# View cron logs
tail -f /var/www/token-website/logs/wallet-fees-cron.log

# List your crontab entries
crontab -l
```

## Complete Cron Setup Example

Here's a complete example of all your cron jobs:

```bash
# Edit crontab
crontab -e

# Add all your cron jobs:
# Auto match orders (every 5 minutes)
*/5 * * * * curl -s https://pryvons.com/api/cron/auto-match-orders >> /var/www/token-website/logs/auto-match.log 2>&1

# Process stakings (every hour)
0 * * * * curl -s https://pryvons.com/api/cron/process-stakings >> /var/www/token-website/logs/stakings.log 2>&1

# Process wallet fees (daily at 2:00 AM)
0 2 * * * /var/www/token-website/scripts/cron-wallet-fees.sh

# Cleanup reset tokens (every 6 hours)
0 */6 * * * curl -H "Authorization: Bearer jfn39s8s2K_sT1X!" -s https://pryvons.com/api/cron/cleanup-reset-tokens >> /var/www/token-website/logs/cleanup.log 2>&1
```

## Troubleshooting

### Issue: Still getting "Unauthorized"

1. **Check environment variable is set:**
   ```bash
   # In your Next.js app directory
   echo $CRON_SECRET
   # Should output: jfn39s8s2K_sT1X!
   ```

2. **Check .env.local file:**
   ```bash
   cat .env.local | grep CRON_SECRET
   ```

3. **Verify the token matches exactly:**
   - No extra spaces
   - Case-sensitive
   - Special characters are preserved

4. **Check application logs:**
   ```bash
   # If using PM2
   pm2 logs
   
   # If using systemd
   journalctl -u your-app-name -f
   ```

### Issue: Cron job not running

1. **Check cron service:**
   ```bash
   systemctl status cron
   sudo systemctl start cron
   ```

2. **Check cron logs:**
   ```bash
   # View system cron logs
   grep CRON /var/log/syslog
   
   # Or check your application logs
   tail -f /var/www/token-website/logs/wallet-fees-cron.log
   ```

3. **Test script manually:**
   ```bash
   /var/www/token-website/scripts/cron-wallet-fees.sh
   ```

## Security Notes

- **Never commit CRON_SECRET to git**
- Use a strong, random secret (at least 32 characters)
- Keep your .env.local file secure (chmod 600)
- Rotate secrets periodically

## Summary

- **Wallet fee after deposit**: Automatic (no cron needed)
- **Batch wallet fee processing**: Daily cron job at `/api/cron/process-wallet-fees`
- **CRON_SECRET**: Must match between environment variable and curl command
- **Cron schedule**: Recommended daily at 2:00 AM

