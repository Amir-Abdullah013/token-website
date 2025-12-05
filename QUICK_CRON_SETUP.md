# Quick Cron Setup Guide

## Fix "Unauthorized" Error

The error happens because `CRON_SECRET` environment variable doesn't match your token.

### Quick Fix:

1. **Set environment variable on VPS:**
   ```bash
   cd /var/www/token-website
   nano .env.local
   ```
   
   Add this line:
   ```
   CRON_SECRET=jfn39s8s2K_sT1X!
   ```

2. **Restart your app:**
   ```bash
   # If using PM2
   pm2 restart all
   
   # If using systemd
   sudo systemctl restart your-app-name
   ```

3. **Test:**
   ```bash
   curl -H "Authorization: Bearer jfn39s8s2K_sT1X!" https://pryvons.com/api/cron/process-wallet-fees
   ```

## Add Cron Job to VPS

### Step 1: Make script executable
```bash
cd /var/www/token-website
chmod +x scripts/cron-wallet-fees.sh
```

### Step 2: Add to crontab
```bash
crontab -e
```

Add this line (runs daily at 2:00 AM):
```
0 2 * * * /var/www/token-website/scripts/cron-wallet-fees.sh
```

### Step 3: Verify
```bash
# Check crontab
crontab -l

# Check logs
tail -f /var/www/token-website/logs/wallet-fees-cron.log
```

## Important Notes

### Wallet Fee Processing After Deposit
- **NOT a cron job** - it's automatic!
- Happens when admin approves a deposit
- No setup needed - already implemented
- Function: `processWalletFeeAfterDeposit()` in `walletFeeService.js`

### Batch Wallet Fee Processing
- **IS a cron job** - runs daily
- Processes all users whose 30-day trial ended
- Endpoint: `/api/cron/process-wallet-fees`
- Requires CRON_SECRET authentication

## Complete Cron Setup

Here's all your cron jobs in one place:

```bash
crontab -e
```

Add all these lines:

```bash
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

**Still getting "Unauthorized"?**
1. Check `.env.local` has `CRON_SECRET=jfn39s8s2K_sT1X!`
2. Restart your application
3. Check app logs for errors

**Cron not running?**
1. Check cron service: `systemctl status cron`
2. Check logs: `tail -f /var/www/token-website/logs/wallet-fees-cron.log`
3. Test script manually: `/var/www/token-website/scripts/cron-wallet-fees.sh`

