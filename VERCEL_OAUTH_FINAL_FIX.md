# 🚨 Vercel OAuth "redirect_uri_mismatch" - FINAL FIX

## ❌ **The Exact Problem**

You're getting **"Error 400: redirect_uri_mismatch"** on Vercel because:

1. **Environment variables are set correctly** ✅
2. **Google Cloud Console is configured correctly** ✅  
3. **BUT**: The OAuth configuration is not using the correct Vercel URL

## 🔍 **Root Cause Analysis**

The issue is that `VERCEL_URL` environment variable is **not accessible on the client-side** in Next.js, so the OAuth configuration is falling back to incorrect URLs.

## 🛠️ **Complete Solution**

### Step 1: Set NEXT_PUBLIC_NEXTAUTH_URL in Vercel

**This is the critical fix!** You need to add this environment variable in Vercel:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add this variable**:
   ```
   NEXT_PUBLIC_NEXTAUTH_URL=https://token-website-virid.vercel.app
   ```
3. **Set it for**: Production, Preview, and Development
4. **Redeploy** your application

### Step 2: Verify Google Cloud Console

Make sure these EXACT URLs are in your Google Cloud Console:

#### **Authorized JavaScript origins:**
```
https://token-website-virid.vercel.app
http://localhost:3000
```

#### **Authorized redirect URIs:**
```
https://token-website-virid.vercel.app/api/auth/oauth-callback
http://localhost:3000/api/auth/oauth-callback
```

### Step 3: Test the Fix

1. **Visit**: `https://token-website-virid.vercel.app/oauth-diagnostic`
2. **Check that**:
   - ✅ Base URL shows: `https://token-website-virid.vercel.app`
   - ✅ Redirect URI shows: `https://token-website-virid.vercel.app/api/auth/oauth-callback`
   - ✅ Environment shows: `production`
3. **Test OAuth**: `https://token-website-virid.vercel.app/auth/signin`
4. **Click "Sign in with Google"** - should work now!

## 🔧 **Why This Happens**

### The Problem:
- `VERCEL_URL` is only available on the **server-side**
- Client-side code can't access `VERCEL_URL`
- OAuth configuration falls back to `window.location.origin`
- But this might not match what's in Google Cloud Console

### The Solution:
- `NEXT_PUBLIC_NEXTAUTH_URL` is available on **both server and client-side**
- This ensures consistent URL detection
- OAuth configuration uses the correct Vercel URL

## 📋 **Environment Variables Checklist**

Make sure these are set in Vercel:

### Required Variables:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_NEXTAUTH_URL=https://token-website-virid.vercel.app
```

### Optional (for email):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 🧪 **Testing Steps**

1. **Add `NEXT_PUBLIC_NEXTAUTH_URL`** to Vercel environment variables
2. **Redeploy** your application
3. **Visit**: `/oauth-diagnostic` to verify configuration
4. **Test OAuth flow**: `/auth/signin`
5. **Click "Sign in with Google"**

## 🎯 **Expected Results**

After adding `NEXT_PUBLIC_NEXTAUTH_URL`:

✅ **OAuth diagnostic shows correct URLs**
✅ **No more "redirect_uri_mismatch" errors**
✅ **Google OAuth works perfectly on Vercel**
✅ **Users can sign in with Google**
✅ **Dashboard shows correct user data**

## 🆘 **Still Having Issues?**

If you're still getting the error:

1. **Double-check** that `NEXT_PUBLIC_NEXTAUTH_URL` is set correctly in Vercel
2. **Redeploy** after adding the environment variable
3. **Wait 5-10 minutes** for Google's cache to update
4. **Test in incognito mode** to avoid browser cache
5. **Use the diagnostic page** to verify the exact URLs being used

## 🎉 **Success Indicators**

When the fix works:
- ✅ Diagnostic page shows correct Vercel URL
- ✅ Google OAuth page loads without errors
- ✅ User can authorize the application
- ✅ Redirect back to dashboard works
- ✅ User data displays correctly

The key is ensuring `NEXT_PUBLIC_NEXTAUTH_URL` is set in Vercel environment variables!
