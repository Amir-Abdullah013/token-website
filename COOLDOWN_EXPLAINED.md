# Cooldown System - Complete Explanation

## 🎯 How It Works

The cooldown system ensures users wait **30 minutes** between watching ads. Here's the exact flow:

### 1. User Watches First Ad
```
1. User clicks "Visit Ad & Earn 10 Points"
2. Frontend checks: nextAdAvailable = null (no previous ad)
3. ✅ Check passes → Ad window opens
4. User watches for 30+ seconds
5. User closes window
6. Backend API called: POST /api/ads/complete
7. Backend checks cooldown (no previous ad found)
8. ✅ Check passes → Credits 10 points
9. Backend inserts record into ad_rewards table:
   - userId: "abc123"
   - reward: 10
   - createdAt: "2026-02-06 14:00:00" ← TIMESTAMP STORED
10. Backend calculates: nextAvailable = createdAt + 30 minutes
    = "2026-02-06 14:30:00"
11. Backend returns: { nextAdAvailable: "2026-02-06T14:30:00Z" }
12. Frontend updates: nextAdAvailable state
13. Button disabled, shows "Wait 30 minutes"
```

### 2. User Tries to Watch Again (Before 30 Min)
```
Current time: 14:15:00
Last ad time: 14:00:00
Next available: 14:30:00

1. User clicks "Visit Ad"
2. Frontend checks: 
   - nextAdAvailable = "2026-02-06T14:30:00Z"
   - Current time = "2026-02-06T14:15:00Z"
   - Is 14:15 < 14:30? → YES
3. ❌ Check fails
4. Error shown: "Please wait 15 more minutes"
5. No ad opens
6. No API call made
```

### 3. User Tries to Watch Again (After 30 Min)
```
Current time: 14:31:00
Last ad time: 14:00:00
Next available: 14:30:00

1. User clicks "Visit Ad"
2. Frontend checks:
   - nextAdAvailable = "2026-02-06T14:30:00Z"
   - Current time = "2026-02-06T14:31:00Z"
   - Is 14:31 < 14:30? → NO
3. ✅ Check passes → Ad window opens
4. User watches for 30+ seconds
5. User closes window
6. Backend API called: POST /api/ads/complete
7. Backend checks cooldown:
   - Last ad: "2026-02-06 14:00:00"
   - Next available: 14:00:00 + 30 min = 14:30:00
   - Current time: 14:31:00
   - Is 14:31 < 14:30? → NO
8. ✅ Check passes → Credits 10 points
9. Backend inserts new record:
   - createdAt: "2026-02-06 14:31:00" ← NEW TIMESTAMP
10. Backend calculates: nextAvailable = 14:31:00 + 30 min
    = "2026-02-06 15:01:00"
11. Frontend updates: nextAdAvailable = "2026-02-06T15:01:00Z"
12. Cycle repeats
```

## 📊 Database Storage

### ad_rewards Table
```sql
CREATE TABLE ad_rewards (
  id UUID PRIMARY KEY,
  userId TEXT NOT NULL,
  reward DECIMAL(30,8),
  status TEXT,
  createdAt TIMESTAMP NOT NULL,  ← THIS IS THE KEY!
  updatedAt TIMESTAMP
);
```

### How Timestamp is Used
```sql
-- When user completes ad
INSERT INTO ad_rewards (id, userId, reward, status, createdAt, updatedAt)
VALUES (gen_random_uuid(), 'user123', 10, 'COMPLETED', NOW(), NOW());
-- NOW() stores current server time

-- When checking cooldown
SELECT MAX(createdAt) as last_watched
FROM ad_rewards
WHERE userId = 'user123';
-- Gets the most recent ad timestamp

-- Calculate if 30 minutes passed
SELECT 
  createdAt + INTERVAL '30 minutes' as next_available,
  NOW() >= createdAt + INTERVAL '30 minutes' as can_watch
FROM ad_rewards
WHERE userId = 'user123'
ORDER BY createdAt DESC
LIMIT 1;
```

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ USER CLICKS "VISIT AD"                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: Check nextAdAvailable                         │
│                                                          │
│ if (nextAdAvailable && now < nextAdAvailable) {         │
│   ❌ Show error: "Wait X minutes"                       │
│   return; // Stop here                                  │
│ }                                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ (Check passed)
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: Open ad window                                │
│ - Start 30-second timer                                 │
│ - Show countdown                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ (User watches 30+ seconds)
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: User closes window                            │
│ - Check time spent >= 30 seconds                        │
│ - Call API: POST /api/ads/complete                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ BACKEND: Check cooldown (Double validation!)            │
│                                                          │
│ SELECT MAX(createdAt) FROM ad_rewards                   │
│ WHERE userId = 'user123'                                │
│                                                          │
│ if (lastWatched) {                                      │
│   nextAvailable = lastWatched + 30 minutes              │
│   if (now < nextAvailable) {                            │
│     ❌ Return error 429: "Wait X minutes"               │
│     return; // Stop here                                │
│   }                                                      │
│ }                                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ (Check passed)
┌─────────────────────────────────────────────────────────┐
│ BACKEND: Credit points                                  │
│                                                          │
│ 1. UPDATE wallets                                       │
│    SET lockedAdPoints = lockedAdPoints + 10             │
│                                                          │
│ 2. INSERT INTO ad_rewards                               │
│    VALUES (userId, 10, NOW())  ← Store timestamp!       │
│                                                          │
│ 3. Calculate nextAvailable = NOW() + 30 minutes         │
│                                                          │
│ 4. Return { nextAdAvailable: "2026-02-06T15:00:00Z" }  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: Update state                                  │
│                                                          │
│ - setNextAdAvailable(result.nextAdAvailable)            │
│ - setLockedPoints(lockedPoints + 10)                    │
│ - Refresh history                                       │
│ - Show success message                                  │
│ - Disable button for 30 minutes                         │
└─────────────────────────────────────────────────────────┘
```

## 🔒 Double Validation

### Why Two Checks?

1. **Frontend Check** (User Experience)
   - Instant feedback
   - No need to wait for API call
   - Shows exact time remaining
   - Prevents unnecessary API calls

2. **Backend Check** (Security)
   - Cannot be bypassed
   - Source of truth
   - Prevents cheating
   - Database-based validation

### Example of Both Working:

```javascript
// FRONTEND (src/app/user/ads/page.js)
const handleWatchAd = async () => {
  // Check #1: Frontend validation
  if (nextAdAvailable && new Date() < new Date(nextAdAvailable)) {
    error("Please wait X minutes");
    return; // Stops here if cooldown active
  }
  
  // Open ad window...
  // User watches and closes...
  
  // Call backend
  const response = await fetch('/api/ads/complete', {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

// BACKEND (src/app/api/ads/complete/route.js)
export async function POST(request) {
  const { userId } = await request.json();
  
  // Check #2: Backend validation
  const lastAd = await db.query(
    'SELECT MAX(createdAt) FROM ad_rewards WHERE userId = $1',
    [userId]
  );
  
  if (lastAd) {
    const nextAvailable = new Date(lastAd.createdAt.getTime() + 30 * 60 * 1000);
    if (new Date() < nextAvailable) {
      return error(429, "Please wait X minutes");
      // Stops here if cooldown active
    }
  }
  
  // Credit points...
  // Store new timestamp...
}
```

## ⏱️ Time Calculations

### How Minutes Remaining is Calculated:

```javascript
// Get next available time
const nextTime = new Date(nextAdAvailable); // "2026-02-06T14:30:00Z"

// Get current time
const now = new Date(); // "2026-02-06T14:15:00Z"

// Calculate difference in milliseconds
const diffMs = nextTime - now; // 900000 ms

// Convert to minutes (round up)
const minutesLeft = Math.ceil(diffMs / 60000); // 15 minutes

// Show to user
error(`Please wait ${minutesLeft} more minutes`);
```

### How Next Available Time is Calculated:

```javascript
// Backend (after crediting points)
const lastWatchedTime = new Date(adRewardResult.rows[0].createdAt);
// "2026-02-06T14:00:00Z"

const COOLDOWN_MINUTES = 30;

const nextAvailableTime = new Date(
  lastWatchedTime.getTime() + COOLDOWN_MINUTES * 60 * 1000
);
// 14:00:00 + (30 * 60 * 1000) ms
// = 14:00:00 + 1800000 ms
// = 14:30:00

return {
  nextAdAvailable: nextAvailableTime.toISOString()
  // "2026-02-06T14:30:00.000Z"
};
```

## 🧪 Testing the Cooldown

### Test Script:
```bash
node scripts/test-cooldown.js
```

This will show:
- Last ad watched time
- Current time
- Next available time
- Minutes since last ad
- Minutes until next ad
- Whether user can watch now

### Manual Test:
1. Watch an ad
2. Note the current time
3. Try to watch again immediately → Should block
4. Wait 30 minutes
5. Try again → Should allow

### Quick Test (1-minute cooldown):
```javascript
// Temporarily change in src/app/api/ads/complete/route.js
const COOLDOWN_MINUTES = 1; // Instead of 30

// Now you only wait 1 minute for testing
```

## ✅ Verification Checklist

- [ ] Database has `ad_rewards` table with `createdAt` column
- [ ] After watching ad, `createdAt` timestamp is stored
- [ ] `/api/ads/stats` returns correct `nextAdAvailable`
- [ ] Frontend receives and stores `nextAdAvailable`
- [ ] Button shows correct minutes remaining
- [ ] Clicking before 30 min shows error
- [ ] Clicking after 30 min opens ad
- [ ] After second ad, new timestamp stored
- [ ] Cooldown resets for another 30 minutes

## 🎯 Summary

The cooldown system works by:

1. **Storing timestamp** when user completes ad (`createdAt` in database)
2. **Calculating next time** = timestamp + 30 minutes
3. **Checking current time** against next available time
4. **Allowing ad** only if current time >= next available time
5. **Repeating** the cycle for each ad

**Key Points:**
- ✅ Timestamp stored in database (source of truth)
- ✅ Frontend checks for UX (instant feedback)
- ✅ Backend checks for security (cannot bypass)
- ✅ 30-minute cooldown enforced
- ✅ Updates after each ad

**The system is working correctly!** If you're experiencing issues, use the debugging guide and test script to identify the problem.
