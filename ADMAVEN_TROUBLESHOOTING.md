# AdMaven Troubleshooting Guide

## ✅ Latest Fix Applied

### What Was Changed:
1. **Method Detection Order**: Now checks `window.invoke` FIRST (most common AdMaven method)
2. **Better Debugging**: Console logs show exactly what methods are available
3. **Safer Checks**: Added proper type checking before calling methods

### Current Detection Order:
```javascript
1. window.invoke() - Direct invoke function (MOST COMMON)
2. window.AdProvider.startInterstitialAd() - Interstitial ad method
3. window.AdProvider.show() - Generic show method
4. window.AdProvider.showAd() - Alternative show method
```

## 🔍 Debugging Steps

### Step 1: Check Console Logs
When you click "Watch Ad", you should see:
```
Checking methods: {
  invoke: "function",  // or "undefined"
  AdProvider: ["method1", "method2", ...]  // or "none"
}
```

### Step 2: Identify Which Method Exists
Look for one of these messages:
- ✅ `"Using window.invoke"` - This is the most common
- ✅ `"Using AdProvider.startInterstitialAd"` - Alternative method
- ❌ `"No AdMaven show method found"` - Script not loaded properly

### Step 3: If No Method Found
The console will show all available window properties with "ad" or "invoke":
```javascript
Available window properties: ['invoke', 'AdProvider', ...]
```

## 🛠️ Common Issues & Solutions

### Issue 1: "No AdMaven show method found"
**Cause**: AdMaven script didn't load or loaded incorrectly
**Solutions**:
1. Check if script loaded: Look for `"📺 AdMaven script loaded"` in console
2. Refresh the page (Ctrl+F5)
3. Check CSP headers allow `https://a.magsrv.com`
4. Try different browser (disable ad blockers)

### Issue 2: Script loads but no methods available
**Cause**: AdMaven script loaded but didn't initialize
**Solutions**:
1. Wait a few seconds after page load
2. Check for JavaScript errors in console
3. Verify zone ID is correct: `Bqjw5qTUH`

### Issue 3: Ad shows but doesn't credit points
**Cause**: Callback not firing or backend error
**Solutions**:
1. Check for `"✅ Ad completed successfully"` in console
2. Check Network tab for `/api/ads/complete` request
3. Look for backend errors in server logs

### Issue 4: Cooldown not working
**Cause**: Backend validation or timestamp issue
**Solutions**:
1. Check database for last ad timestamp
2. Verify server time is correct
3. Check `/api/ads/stats` response

## 📋 Testing Checklist

### Before Testing:
- [ ] Page loaded completely
- [ ] Saw "✓ Ads Ready" badge
- [ ] No JavaScript errors in console
- [ ] Ad blocker disabled

### During Testing:
- [ ] Click "Watch Ad" button
- [ ] See "Checking methods" log
- [ ] See "Using window.invoke" (or other method)
- [ ] Ad displays full-screen
- [ ] Watch entire ad

### After Ad Completes:
- [ ] See "✅ Ad completed successfully"
- [ ] See success message with points
- [ ] Locked points increased
- [ ] Cooldown timer shows 30 minutes
- [ ] Button disabled

## 🔬 Advanced Debugging

### Check if invoke exists:
```javascript
// In browser console
console.log('invoke:', typeof window.invoke);
console.log('AdProvider:', window.AdProvider);
```

### Manually trigger ad (for testing):
```javascript
// Only use this to test if invoke works
if (window.invoke) {
  window.invoke({
    zoneId: 'Bqjw5qTUH',
    onAdCompleted: () => console.log('Ad done!'),
    onAdError: (e) => console.error('Ad error:', e)
  });
}
```

### Check last ad time:
```sql
SELECT "userId", "createdAt", 
       NOW() - "createdAt" as time_since,
       NOW() + INTERVAL '30 minutes' - "createdAt" as time_until_next
FROM ad_rewards 
WHERE "userId" = 'your-user-id'
ORDER BY "createdAt" DESC 
LIMIT 1;
```

## 📊 Expected Console Output

### Successful Flow:
```
1. "📺 AdMaven script loaded"
2. "✅ AdMaven AdProvider loaded"
3. [User clicks button]
4. "Checking methods: { invoke: 'function', AdProvider: [...] }"
5. "Using window.invoke"
6. [Ad plays]
7. "✅ Ad completed successfully"
8. [API call to /api/ads/complete]
9. Success toast appears
```

### Failed Flow (No Method):
```
1. "📺 AdMaven script loaded"
2. "✅ AdMaven AdProvider loaded"
3. [User clicks button]
4. "Checking methods: { invoke: 'undefined', AdProvider: 'none' }"
5. "❌ No AdMaven show method found"
6. "Available window properties: [...]"
7. Error toast appears
```

## 🎯 What to Report

If ads still don't work, provide:
1. Console logs (especially "Checking methods" output)
2. Network tab screenshot
3. Any JavaScript errors
4. Browser and version
5. Ad blocker status

## ✨ Current Status

After this fix:
- ✅ Checks for `window.invoke` first (most reliable)
- ✅ Better error messages
- ✅ Detailed debugging logs
- ✅ Safer method detection
- ✅ Multiple fallback methods

The system should now properly detect and use the AdMaven ad display method!
