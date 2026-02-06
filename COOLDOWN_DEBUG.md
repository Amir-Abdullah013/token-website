# Cooldown Debugging Guide

## How to Debug Cooldown Issues

### 1. Check Browser Console
When you click "Visit Ad", look for these logs:
```
=== Cooldown Check ===
Next ad available: 2026-02-06T15:20:00.000Z
Current time: 2026-02-06T14:50:00.000Z
Next available time: 2026-02-06T15:20:00.000Z
Time difference (ms): 1800000
❌ Cooldown active: 30 minutes, 1800 seconds
```

### 2. Check Database
Run this query to see the last ad timestamp:
```sql
SELECT "userId", "createdAt", 
       NOW() as current_time,
       NOW() - "createdAt" as time_since_last_ad,
       EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 60 as minutes_since_last_ad
FROM ad_rewards 
WHERE "userId" = 'your-user-id'
ORDER BY "createdAt" DESC 
LIMIT 1;
```

### 3. Check API Response
Look at Network tab for `/api/ads/stats`:
```json
{
  "success": true,
  "adsWatchedToday": 1,
  "nextAdAvailable": "2026-02-06T15:20:00.000Z"
}
```

### 4. Manual Test
In browser console:
```javascript
// Check current cooldown state
console.log('Next ad available:', nextAdAvailable);
console.log('Can watch now?', new Date() >= new Date(nextAdAvailable));

// Calculate time remaining
const next = new Date(nextAdAvailable);
const now = new Date();
const minutesLeft = Math.ceil((next - now) / 60000);
console.log('Minutes remaining:', minutesLeft);
```

## Expected Behavior

### First Ad:
1. User clicks "Visit Ad"
2. No `nextAdAvailable` set (null)
3. Ad opens immediately
4. User watches for 30+ seconds
5. Closes window
6. Points credited
7. `nextAdAvailable` set to NOW + 30 minutes
8. Stored in database as `createdAt` timestamp

### Second Ad (Before 30 min):
1. User clicks "Visit Ad"
2. `nextAdAvailable` = "2026-02-06T15:20:00Z"
3. Current time = "2026-02-06T14:50:00Z"
4. Check: 14:50 < 15:20 → TRUE
5. Error: "Please wait 30 minutes"
6. No ad opens

### Second Ad (After 30 min):
1. User clicks "Visit Ad"
2. `nextAdAvailable` = "2026-02-06T15:20:00Z"
3. Current time = "2026-02-06T15:21:00Z"
4. Check: 15:21 < 15:20 → FALSE
5. Ad opens
6. User watches and closes
7. New `nextAdAvailable` = 15:51:00Z

## Common Issues

### Issue: Cooldown not enforced
**Symptoms**: Can watch ads repeatedly
**Causes**:
1. `nextAdAvailable` not being set
2. Frontend not checking properly
3. Backend not validating

**Debug**:
```javascript
// Check if nextAdAvailable is being set
console.log('After ad complete:', nextAdAvailable);

// Check API response
fetch('/api/ads/stats?userId=YOUR_ID')
  .then(r => r.json())
  .then(d => console.log('Stats:', d));
```

### Issue: Stuck in cooldown
**Symptoms**: Always shows "wait X minutes" even after time passed
**Causes**:
1. `nextAdAvailable` not updating
2. Time zone issues
3. State not refreshing

**Fix**:
```javascript
// Force refresh stats
await fetchAdStats();

// Or reload page
window.location.reload();
```

### Issue: Wrong time calculation
**Symptoms**: Shows wrong minutes remaining
**Causes**:
1. Server time different from client time
2. Timezone conversion issues

**Check**:
```javascript
// Compare server vs client time
const serverTime = new Date(nextAdAvailable);
const clientTime = new Date();
console.log('Server:', serverTime.toISOString());
console.log('Client:', clientTime.toISOString());
console.log('Difference:', (serverTime - clientTime) / 1000, 'seconds');
```

## Testing Cooldown

### Quick Test (Change to 1 minute):
```javascript
// In src/app/api/ads/complete/route.js
const COOLDOWN_MINUTES = 1; // Change from 30 to 1

// Test flow:
1. Watch ad
2. Wait 1 minute
3. Should be able to watch again
```

### Full Test (30 minutes):
```
1. Watch first ad
2. Note the time
3. Try to watch immediately → Should block
4. Wait 30 minutes
5. Try again → Should allow
6. Watch second ad
7. Try immediately → Should block again
```

## Verification Checklist

- [ ] Database has `ad_rewards` table with `createdAt` column
- [ ] `/api/ads/stats` returns `nextAdAvailable`
- [ ] `/api/ads/complete` checks cooldown before crediting
- [ ] Frontend fetches stats on page load
- [ ] Frontend checks `nextAdAvailable` before opening ad
- [ ] Button shows correct cooldown time
- [ ] After completing ad, stats refresh
- [ ] New `nextAdAvailable` is 30 minutes in future

## SQL Queries for Testing

### Check last ad time:
```sql
SELECT * FROM ad_rewards 
WHERE "userId" = 'your-user-id'
ORDER BY "createdAt" DESC 
LIMIT 1;
```

### Check if 30 minutes passed:
```sql
SELECT 
  "createdAt",
  NOW() as current_time,
  "createdAt" + INTERVAL '30 minutes' as next_available,
  CASE 
    WHEN NOW() >= "createdAt" + INTERVAL '30 minutes' 
    THEN 'CAN WATCH' 
    ELSE 'MUST WAIT' 
  END as status,
  EXTRACT(EPOCH FROM ("createdAt" + INTERVAL '30 minutes' - NOW())) / 60 as minutes_remaining
FROM ad_rewards 
WHERE "userId" = 'your-user-id'
ORDER BY "createdAt" DESC 
LIMIT 1;
```

### Reset cooldown (for testing):
```sql
-- Delete last ad record (TESTING ONLY!)
DELETE FROM ad_rewards 
WHERE "userId" = 'your-user-id'
AND id = (
  SELECT id FROM ad_rewards 
  WHERE "userId" = 'your-user-id'
  ORDER BY "createdAt" DESC 
  LIMIT 1
);
```

## Expected Console Logs

### When cooldown active:
```
=== Cooldown Check ===
Next ad available: 2026-02-06T15:20:00.000Z
Current time: 2026-02-06T14:50:00.000Z
Next available time: 2026-02-06T15:20:00.000Z
Time difference (ms): 1800000
❌ Cooldown active: 30 minutes, 1800 seconds
Toast: ⏳ Please wait 30 more minutes before watching another ad.
```

### When cooldown passed:
```
=== Cooldown Check ===
Next ad available: 2026-02-06T15:20:00.000Z
Current time: 2026-02-06T15:21:00.000Z
Next available time: 2026-02-06T15:20:00.000Z
Time difference (ms): -60000
✅ Cooldown check passed, opening ad...
```

### When no previous ad:
```
=== Cooldown Check ===
Next ad available: null
Current time: 2026-02-06T14:50:00.000Z
✅ Cooldown check passed, opening ad...
```

## If Still Not Working

1. **Clear browser cache and reload**
2. **Check server logs** for any errors
3. **Verify database connection** is working
4. **Check time zones** - server and client should match
5. **Test with 1-minute cooldown** first
6. **Check if `fetchAdStats()` is being called** after ad completion

## Contact Points

If cooldown still doesn't work after all checks:
1. Share console logs
2. Share database query results
3. Share Network tab for API calls
4. Share any error messages
