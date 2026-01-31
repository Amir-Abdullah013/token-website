# Render Cron Jobs Setup Guide

This guide will help you set up all cron jobs on Render so they work perfectly without any problems.

## 📋 Prerequisites

1. Your web service must be deployed on Render
2. You need to set up environment variables (see below)
3. You need to have `curl` available in your Render environment (it's included by default)

## 🔧 Step 1: Set Up Environment Variables

In your Render dashboard, go to your **Web Service** settings and add these environment variables:

### Required Environment Variables:

1. **CRON_SECRET** (REQUIRED)
   - Generate a secure random string (e.g., use `openssl rand -hex 32`)
   - This secret will be used to authenticate all cron job requests
   - **IMPORTANT**: Use the same `CRON_SECRET` value for both your web service and all cron job

2. **NEXT_PUBLIC_BASE_URL**
   - Set this to your Render web service URL
   - Format: `https://your-service-name.onrender.com`
   - This is used by cron jobs to make requests to your API endpoints

3. **DATABASE_URL**
   - Your PostgreSQL database connection string
   - Should already be set if you're using a database

## 🚀 Step 2: Deploy Using render.yaml (Recommended)

### Option A: Using render.yaml File (Infrastructure as Code)

1. Make sure your `render.yaml` file is in the root of your repository
2. In Render dashboard, go to **New** → **Blueprint**
3. Connect your Git repository
4. Render will automatically detect and use the `render.yaml` file
5. All services (web + 4 cron jobs) will be created automatically

### Option B: Manual Setup via Dashboard

If you prefer to set up cron jobs manually:

#### 1. Create Cron Job: Auto Match Orders
- **Name**: `auto-match-orders-cron`
- **Schedule**: `* * * * *` (Every minute)
- **Command**:
  ```bash
  curl -X GET "${NEXT_PUBLIC_BASE_URL}/api/cron/auto-match-orders" -H "Authorization: Bearer ${CRON_SECRET}" -H "Content-Type: application/json" --fail --silent --show-error
  ```
- **Environment Variables**:
  - `NEXT_PUBLIC_BASE_URL`: Your web service URL
  - `CRON_SECRET`: Same secret as your web service

#### 2. Create Cron Job: Process Wallet Fees
- **Name**: `process-wallet-fees-cron`
- **Schedule**: `0 0 * * *` (Daily at midnight UTC)
- **Command**:
  ```bash
  curl -X GET "${NEXT_PUBLIC_BASE_URL}/api/cron/process-wallet-fees" -H "Authorization: Bearer ${CRON_SECRET}" -H "Content-Type: application/json" --fail --silent --show-error
  ```
- **Environment Variables**: Same as above

#### 3. Create Cron Job: Process Stakings
- **Name**: `process-stakings-cron`
- **Schedule**: `0 */6 * * *` (Every 6 hours)
- **Command**:
  ```bash
  curl -X GET "${NEXT_PUBLIC_BASE_URL}/api/cron/process-stakings" -H "Authorization: Bearer ${CRON_SECRET}" -H "Content-Type: application/json" --fail --silent --show-error
  ```
- **Environment Variables**: Same as above

#### 4. Create Cron Job: Cleanup Reset Tokens
- **Name**: `cleanup-reset-tokens-cron`
- **Schedule**: `0 * * * *` (Every hour)
- **Command**:
  ```bash
  curl -X GET "${NEXT_PUBLIC_BASE_URL}/api/cron/cleanup-reset-tokens" -H "Authorization: Bearer ${CRON_SECRET}" -H "Content-Type: application/json" --fail --silent --show-error
  ```
- **Environment Variables**: Same as above

## 🔐 Step 3: Security Configuration

### Generate a Secure CRON_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -hex 32
```

Or use an online generator. Make sure to:
- Use a long, random string (at least 32 characters)
- Store it securely
- Use the **exact same value** in both your web service and all cron jobs

### Set CRON_SECRET in Render

1. Go to your **Web Service** → **Environment** tab
2. Add `CRON_SECRET` with your generated secret
3. Go to each **Cron Job** → **Environment** tab
4. Add `CRON_SECRET` with the **same value**

## ✅ Step 4: Verify Setup

### Test Cron Jobs Manually

You can manually trigger each cron job from the Render dashboard to test:

1. Go to your cron job in Render dashboard
2. Click **Manual Trigger** or **Run Now**
3. Check the logs to see if it executed successfully

### Check Logs

Monitor your cron job logs in Render:
- Go to your cron job → **Logs** tab
- Look for successful responses (HTTP 200)
- Check for any authentication errors (HTTP 401)

### Expected Responses

Each cron endpoint should return a JSON response like:

```json
{
  "success": true,
  "message": "...",
  "timestamp": "2024-..."
}
```

## 📊 Cron Job Schedules Summary

| Cron Job | Schedule | Frequency | Purpose |
|----------|----------|-----------|---------|
| Auto Match Orders | `* * * * *` | Every minute | Executes pending limit orders |
| Process Wallet Fees | `0 0 * * *` | Daily at midnight UTC | Processes all due wallet fees |
| Process Stakings | `0 */6 * * *` | Every 6 hours | Processes daily staking rewards |
| Cleanup Reset Tokens | `0 * * * *` | Every hour | Cleans up expired password reset tokens |

## 🐛 Troubleshooting

### Issue: Cron jobs return 401 Unauthorized

**Solution**: 
- Verify that `CRON_SECRET` is set correctly in both web service and cron job
- Ensure the values match exactly (no extra spaces)
- Check that the Authorization header format is correct: `Bearer ${CRON_SECRET}`

### Issue: Cron jobs can't reach the web service

**Solution**:
- Verify `NEXT_PUBLIC_BASE_URL` is set correctly
- Ensure the URL is accessible (try opening it in a browser)
- Check that your web service is running and not sleeping

### Issue: Web service is sleeping (Free Tier)

**Solution**:
- The first request after sleep may be slow (cold start)
- Consider upgrading to a paid plan for better performance
- Or use an external service to ping your web service periodically

### Issue: Cron jobs are not running

**Solution**:
- Check the cron schedule format is correct
- Verify the cron job is enabled in Render dashboard
- Check Render logs for any errors
- Ensure your Render account has cron job functionality enabled

## 📝 Notes

- All cron jobs use UTC timezone
- Render ensures only one instance of each cron job runs at a time
- Cron jobs will retry on failure (check Render documentation for retry behavior)
- Make sure your web service is deployed and running before setting up cron jobs

## 🔄 Updating Cron Jobs

If you need to update cron job configurations:

1. Update the `render.yaml` file
2. Push changes to your Git repository
3. Render will automatically detect and apply changes
4. Or manually update each cron job in the Render dashboard

## 🎉 Success!

Once set up, all your cron jobs will run automatically on Render without any problems. The authentication system ensures only authorized requests can trigger your cron endpoints.

