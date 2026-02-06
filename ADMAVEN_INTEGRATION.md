# AdMaven Integration Guide

This document explains how to integrate AdMaven ads into the Von Token Platform.

## Overview

The ads system is fully implemented and ready for AdMaven integration. Users can earn 10 VON tokens per ad with the following limits:
- **Daily Limit**: 2 ads per day
- **Cooldown**: 30 minutes between ads
- **Reward**: 10 VON tokens per completed ad

## Database Setup

Run the migration to create the `ad_rewards` table:

```sql
-- See migrations/create_ad_rewards_table.sql
CREATE TABLE IF NOT EXISTS ad_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward DECIMAL(30,8) NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  "adTransactionId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Frontend Integration

### 1. Install AdMaven SDK

Add the AdMaven SDK to your `public/index.html` or `app/layout.js`:

```html
<script src="https://admaven.com/sdk/admaven.js"></script>
```

### 2. Update Ads Page

In `src/app/ads/page.js`, locate the `handleWatchAd` function and replace the TODO comment with:

```javascript
// Initialize AdMaven
window.AdMaven.showVideoAd({
  zoneId: 'YOUR_ZONE_ID', // Get this from AdMaven dashboard
  userId: user.id, // Pass user ID for tracking
  onAdStarted: () => {
    console.log('Ad started');
    success('Ad is playing...');
  },
  onAdCompleted: () => {
    handleAdCompleted();
  },
  onAdError: (error) => {
    console.error('Ad error:', error);
    setIsWatchingAd(false);
    error('Failed to load ad. Please try again.');
  }
});
```

## Backend Integration

### 1. Configure Environment Variables

Add to your `.env` file:

```env
ADMAVEN_API_SECRET=your_api_secret_here
ADMAVEN_ZONE_ID=your_zone_id_here
```

### 2. Set Up Server-to-Server Postback

In your AdMaven dashboard:
1. Go to Settings → Postback URL
2. Set the postback URL to: `https://yourdomain.com/api/ads/postback`
3. Configure the postback parameters

### 3. Implement Signature Validation

In `src/app/api/ads/postback/route.js`, uncomment and implement the signature validation:

```javascript
import crypto from 'crypto';

function validateAdMavenSignature(data, secret) {
  const { transaction_id, user_id, payout, timestamp, signature } = data;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${transaction_id}${user_id}${payout}${timestamp}`)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### 4. Update Complete Endpoint

In `src/app/api/ads/complete/route.js`, add transaction ID validation:

```javascript
// Check for duplicate transactions
const existingTransaction = await databaseHelpers.pool.query(
  'SELECT id FROM ad_rewards WHERE "adTransactionId" = $1',
  [adTransactionId]
);

if (existingTransaction.rows.length > 0) {
  return NextResponse.json({ 
    success: false, 
    error: 'Transaction already processed' 
  }, { status: 400 });
}

// Store transaction ID when creating reward
await client.query(
  `INSERT INTO ad_rewards ("userId", reward, status, "adTransactionId", "createdAt", "updatedAt")
   VALUES ($1, $2, 'COMPLETED', $3, NOW(), NOW())`,
  [userId, REWARD_AMOUNT, adTransactionId]
);
```

## Security Considerations

1. **Signature Validation**: Always validate AdMaven's signature to prevent fraudulent requests
2. **Transaction ID**: Store and check transaction IDs to prevent replay attacks
3. **IP Whitelisting**: Only accept postbacks from AdMaven's server IPs
4. **Rate Limiting**: The system already implements daily limits and cooldowns
5. **User Verification**: Ensure the user ID in the postback matches an actual user

## Testing

### Test Flow:
1. Navigate to `/ads` page
2. Click "Watch Ad & Earn 10 VON"
3. Complete the ad (currently simulated with 3-second delay)
4. Verify tokens are credited to wallet
5. Check ad history shows the completed ad
6. Verify cooldown timer is active

### Test Limits:
- Try watching 3 ads in a day (should block after 2)
- Try watching ads within 30 minutes (should show cooldown)
- Check that tokens are properly credited to `VonBalance`

## API Endpoints

- `GET /api/ads/stats` - Get user's ad statistics
- `GET /api/ads/history` - Get user's ad reward history
- `POST /api/ads/complete` - Credit tokens after ad completion
- `POST /api/ads/postback` - Receive AdMaven server-to-server callbacks

## Transaction Types

The system creates transactions with:
- **Type**: `AD_REWARD`
- **Gateway**: `AdMaven`
- **Amount**: 10 VON
- **Fee**: 0 (no fees on ad rewards)

## Monitoring

Monitor the following:
- Daily ad views per user
- Total tokens distributed via ads
- Failed ad completions
- Postback validation failures

## Support

For AdMaven-specific questions, contact AdMaven support.
For platform integration issues, check the TODO comments in the code.
