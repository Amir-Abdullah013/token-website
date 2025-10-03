# Vercel OAuth Setup Guide

This guide will help you configure Google OAuth for your Vercel deployment at `https://token-website-virid.vercel.app`.

## 🔧 **Required Environment Variables for Vercel**

### 1. Set Environment Variables in Vercel Dashboard

Go to your Vercel project dashboard and add these environment variables:

```env
# Database Configuration
DATABASE_URL=your-database-connection-string

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth Configuration (for production)
NEXT_PUBLIC_NEXTAUTH_URL=https://token-website-virid.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key

# Vercel Configuration (automatically set by Vercel)
VERCEL_URL=token-website-virid.vercel.app
```

### 2. Google Cloud Console Configuration

#### Step 1: Update Authorized JavaScript Origins
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. In **Authorized JavaScript origins**, add:
   ```
   https://token-website-virid.vercel.app
   ```

#### Step 2: Update Authorized Redirect URIs
In the same OAuth 2.0 Client ID settings, add to **Authorized redirect URIs**:
```
https://token-website-virid.vercel.app/api/auth/oauth-callback
```

#### Step 3: Verify OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Make sure it's configured and published
3. Add your Vercel domain to authorized domains if needed

## 🚀 **Deployment Steps**

### 1. Update Your Code
The following files have been updated to handle Vercel deployment:

- `src/lib/config.js` - Updated URL handling for Vercel
- `src/app/api/auth/oauth/google/route.js` - Updated redirect URI logic

### 2. Deploy to Vercel
```bash
# If using Vercel CLI
vercel --prod

# Or push to your connected Git repository
git add .
git commit -m "Update OAuth for Vercel deployment"
git push origin main
```

### 3. Verify Environment Variables
After deployment, verify your environment variables are set correctly in the Vercel dashboard.

## 🔍 **Testing OAuth on Vercel**

### 1. Test the OAuth Flow
1. Visit `https://token-website-virid.vercel.app/auth/signin`
2. Click "Sign in with Google"
3. Complete the Google OAuth flow
4. You should be redirected to the dashboard

### 2. Debug OAuth Issues
If OAuth doesn't work, check:

1. **Environment Variables**: Ensure all required variables are set in Vercel
2. **Google Console**: Verify redirect URIs match exactly
3. **Browser Console**: Check for any JavaScript errors
4. **Network Tab**: Look for failed requests

### 3. Common Issues & Solutions

#### Issue: "redirect_uri_mismatch" Error
**Solution**: Ensure the redirect URI in Google Console exactly matches:
```
https://token-website-virid.vercel.app/api/auth/oauth-callback
```

#### Issue: OAuth Redirects to Wrong URL
**Solution**: Check that `NEXT_PUBLIC_NEXTAUTH_URL` is set to:
```
https://token-website-virid.vercel.app
```

#### Issue: Environment Variables Not Loading
**Solution**: 
1. Redeploy after setting environment variables
2. Check that variables are set for the correct environment (Production)
3. Ensure variable names match exactly (case-sensitive)

## 📋 **Complete Checklist**

- [ ] Environment variables set in Vercel dashboard
- [ ] Google Cloud Console updated with Vercel URLs
- [ ] Code deployed to Vercel
- [ ] OAuth flow tested on production
- [ ] User can sign in and access dashboard
- [ ] No console errors during OAuth flow

## 🔧 **Troubleshooting Commands**

### Check Environment Variables
```bash
# In your Vercel project, check if variables are loaded
vercel env ls
```

### Test OAuth Endpoint
```bash
# Test the OAuth initiation endpoint
curl -X POST https://token-website-virid.vercel.app/api/auth/oauth/google
```

### Check Deployment Logs
```bash
# View Vercel function logs
vercel logs
```

## 📞 **Support**

If you encounter issues:

1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Ensure Google Cloud Console configuration matches your Vercel URLs
4. Test the OAuth flow in an incognito window
5. Check Vercel function logs for server-side errors

The OAuth flow should now work seamlessly on your Vercel deployment!
