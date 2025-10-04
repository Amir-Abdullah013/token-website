# Vercel OAuth Fix Guide

## 🚨 Problem: Error 400: redirect_uri_mismatch

The Google OAuth error occurs because the redirect URI in Google Cloud Console doesn't match the actual Vercel URL.

## ✅ Solution Steps

### 1. Get Your Vercel URL
Your Vercel URL should be: `https://token-website-virid.vercel.app`

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID
4. Click **Edit** (pencil icon)

### 3. Update Authorized Redirect URIs

Add these URLs to your **Authorized redirect URIs**:

```
https://token-website-virid.vercel.app/api/auth/oauth-callback
http://localhost:3000/api/auth/oauth-callback
```

### 4. Update Authorized JavaScript Origins

Add these URLs to your **Authorized JavaScript origins**:

```
https://token-website-virid.vercel.app
http://localhost:3000
```

### 5. Save Changes

Click **Save** in Google Cloud Console.

## 🔧 Environment Variables Check

Ensure these are set in Vercel:

### Required Environment Variables:
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

## 🧪 Testing Steps

1. **Test on Vercel**: Visit `https://token-website-virid.vercel.app/auth/signin`
2. **Click "Sign in with Google"**
3. **Should redirect to Google OAuth**
4. **After authorization, should redirect back to dashboard**

## 🐛 Common Issues

### Issue 1: Still getting redirect_uri_mismatch
- **Solution**: Wait 5-10 minutes for Google changes to propagate
- **Check**: Ensure the exact URL matches (no trailing slashes)

### Issue 2: OAuth works but user data not showing
- **Solution**: Check browser console for errors
- **Check**: Verify localStorage is storing user data

### Issue 3: Environment variables not working
- **Solution**: Redeploy on Vercel after adding env vars
- **Check**: Use `/debug-env` page to verify variables

## 📋 Complete Google Cloud Console Setup

### Step-by-Step:

1. **Go to Google Cloud Console**
2. **Select your project**
3. **Navigate to APIs & Services > Credentials**
4. **Click on your OAuth 2.0 Client ID**
5. **Update the following fields:**

#### Authorized JavaScript origins:
```
https://token-website-virid.vercel.app
http://localhost:3000
```

#### Authorized redirect URIs:
```
https://token-website-virid.vercel.app/api/auth/oauth-callback
http://localhost:3000/api/auth/oauth-callback
```

6. **Click Save**
7. **Wait 5-10 minutes**
8. **Test on Vercel**

## 🎯 Expected Result

After following these steps:
- ✅ Google OAuth should work on Vercel
- ✅ Users should be able to sign in with Google
- ✅ User data should display correctly on dashboard
- ✅ Both localhost and Vercel should work

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the exact Vercel URL** in your deployment
2. **Verify environment variables** are set correctly
3. **Clear browser cache** and try again
4. **Check browser console** for any JavaScript errors
5. **Wait 10-15 minutes** for Google changes to propagate

The key is ensuring the redirect URI in Google Cloud Console **exactly matches** your Vercel URL.
