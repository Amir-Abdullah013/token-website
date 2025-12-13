# Render Cron Jobs - Quick Start Guide

## ✅ What's Been Set Up

All cron jobs are now configured to work perfectly on Render:

1. ✅ **render.yaml** - Complete configuration file for all services and cron jobs
2. ✅ **Cron Authentication** - Updated to support Render (uses CRON_SECRET)
3. ✅ **All 4 Cron Jobs** - Configured with proper schedules and authentication

## 🚀 Quick Setup (3 Steps)

### Step 1: Set Environment Variables in Render

Go to your **Web Service** → **Environment** tab and add:

```
CRON_SECRET=your-secure-secret-here
NEXT_PUBLIC_BASE_URL=https://your-service-name.onrender.com
```

**Generate CRON_SECRET:**
```bash
openssl rand -hex 32
```

### Step 2: Deploy with render.yaml

**Option A: Using Blueprint (Recommended)**
1. In Render dashboard: **New** → **Blueprint**
2. Connect your Git repository
3. Render will auto-detect `render.yaml` and create all services

**Option B: Manual Setup**
1. Create web service first
2. Create each cron job manually using commands from `RENDER_CRON_SETUP.md`

### Step 3: Set CRON_SECRET in Each Cron Job

For each cron job you create:
1. Go to **Environment** tab
2. Add `CRON_SECRET` with the **same value** as your web service
3. Add `NEXT_PUBLIC_BASE_URL` (or it will auto-sync from web service)

## 📋 Cron Jobs Summary

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Auto Match Orders | Every minute | `/api/cron/auto-match-orders` |
| Process Wallet Fees | Daily at midnight | `/api/cron/process-wallet-fees` |
| Process Stakings | Every 6 hours | `/api/cron/process-stakings` |
| Cleanup Reset Tokens | Every hour | `/api/cron/cleanup-reset-tokens` |

## 🧪 Test Your Setup

After deployment, test all cron jobs:

```bash
node scripts/test-render-crons.js
```

Or manually test in Render dashboard:
1. Go to each cron job
2. Click **Manual Trigger** or **Run Now**
3. Check logs for success

## 🔐 Security

- All cron endpoints are protected with `CRON_SECRET`
- Only requests with valid `Authorization: Bearer ${CRON_SECRET}` header are allowed
- Vercel Cron also works (uses `x-vercel-signature` header)

## 📚 Full Documentation

See `RENDER_CRON_SETUP.md` for detailed setup instructions and troubleshooting.

## ✨ That's It!

Once set up, all cron jobs will run automatically on Render without any problems. 🎉

