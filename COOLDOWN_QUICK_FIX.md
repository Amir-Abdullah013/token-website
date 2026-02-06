# Quick Cooldown Fix

## Issue: Cooldown showing "0m"

This means `nextAdAvailable` is either:
1. `null` (no previous ad)
2. In the past (cooldown already passed)
3. Not being set correctly

## Quick Debug Steps:

### 1. Open Browser Console (F12)
Look for these logs when page loads:
```
Ad stats: { adsWatchedToday: X, nextAdAvailable: "..." }
```

### 2. Check what `nextAdAvailable` is:
In console, type:
```javascript
// This will show the current state
console.log('Next ad available:', nextAdAvailable);
```

### 3. Manual check in database:
```sql
SELECT "userId", "createdAt", 
       NOW() as current_time,
       "createdAt" + INTERVAL '30 minutes' as next_available,
       EXTRACT(EPOCH FROM ("createdAt" + INTERVAL '30 minutes' - NOW())) / 60 as minutes_remaining
FROM ad_rewards 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

## Possible Causes:

### Cause 1: No ads watched yet
- **Symptom**: `nextAdAvailable` is `null`
- **Expected**: Cooldown shows "0m" (correct behavior)
- **Solution**: Watch an ad first

### Cause 2: Cooldown already passed
- **Symptom**: `nextAdAvailable` is in the past
- **Expected**: Cooldown shows "0m" (correct behavior)
- **Solution**: This is normal - you can watch another ad

### Cause 3: API not returning `nextAdAvailable`
- **Symptom**: API response doesn't include `nextAdAvailable`
- **Check**: Network tab → `/api/ads/stats` → Response
- **Solution**: Check backend `/api/ads/stats/route.js`

### Cause 4: State not updating
- **Symptom**: State stays `null` even after API call
- **Check**: Console logs show data but UI doesn't update
- **Solution**: React state issue

## Quick Test:

### 1. Watch an ad right now
1. Click "Visit Ad & Earn 10 Points"
2. Wait 30 seconds
3. Close window
4. Check if cooldown now shows "30m"

### 2. Check API directly
Open in browser:
```
http://localhost:3000/api/ads/stats?userId=YOUR_USER_ID
```

Should return:
```json
{
  "success": true,
  "adsWatchedToday": 1,
  "nextAdAvailable": "2026-02-06T15:30:00.000Z"
}
```

### 3. Check console logs
After watching an ad, you should see:
```
Ad stats: { 
  adsWatchedToday: 1, 
  nextAdAvailable: "2026-02-06T15:30:00.000Z" 
}
```

## Expected Behavior:

### Before watching any ad:
- Cooldown: **0m** ✅ (correct - no previous ad)
- Button: Enabled
- Can watch: Yes

### Right after watching ad:
- Cooldown: **30m** ✅ (correct - just watched)
- Button: Disabled
- Can watch: No

### 30 minutes later:
- Cooldown: **0m** ✅ (correct - cooldown passed)
- Button: Enabled
- Can watch: Yes

## If cooldown is ALWAYS "0m":

This means `nextAdAvailable` is always `null` or in the past.

**Check:**
1. Is `/api/ads/complete` being called after ad?
2. Is it returning `nextAdAvailable` in response?
3. Is frontend updating state with the response?

**Add this to browser console after watching ad:**
```javascript
// Watch the state update
const originalFetch = window.fetch;
window.fetch = function(...args) {
  return originalFetch.apply(this, args).then(response => {
    if (args[0].includes('/api/ads/complete')) {
      response.clone().json().then(data => {
        console.log('=== AD COMPLETE RESPONSE ===');
        console.log(data);
        console.log('nextAdAvailable:', data.nextAdAvailable);
      });
    }
    return response;
  });
};
```

## Most Likely Cause:

**You haven't watched an ad yet!**

The cooldown will show "0m" until you watch your first ad. After that, it should show "30m" and count down.

Try this:
1. Watch an ad now
2. Wait for success message
3. Check if cooldown changes to "30m"
4. If yes → System is working!
5. If no → Check console logs and share them
