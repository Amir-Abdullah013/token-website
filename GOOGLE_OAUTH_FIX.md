# Google OAuth 412 Error Fix Guide

## The Problem
You're getting a `412 Precondition Failed` error when trying to use Google OAuth. This means the Google OAuth provider is not properly configured in your Appwrite console.

## Step-by-Step Fix

### 1. Configure Google OAuth in Appwrite Console

#### Step 1: Go to Appwrite Console
1. Visit [Appwrite Console](https://cloud.appwrite.io/)
2. Select your project
3. Navigate to **Auth** → **Providers**

#### Step 2: Enable Google Provider
1. Find **Google** in the list of providers
2. Click **Enable**
3. You'll see a configuration form

#### Step 3: Configure Google OAuth Settings
Fill in the following fields:

**App ID (Client ID):**
- Use your `NEXT_PUBLIC_GOOGLE_CLIENT_ID` value
- Format: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

**App Secret:**
- Use your `GOOGLE_CLIENT_SECRET` value
- Format: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

**Redirect URLs:**
Add these URLs (one per line):
```
http://localhost:3000
http://localhost:3000/auth/signin
http://localhost:3000/user/dashboard
```

**Scopes:**
Make sure these scopes are enabled:
- `email`
- `profile`
- `openid`

### 2. Verify Google Cloud Console Configuration

#### Step 1: Check Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID

#### Step 2: Verify Authorized Redirect URIs
Make sure these URIs are added:
```
http://localhost:3000
http://localhost:3000/auth/signin
http://localhost:3000/user/dashboard
```

#### Step 3: Check OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Make sure it's configured and published
3. Add test users if in testing mode

### 3. Update Environment Variables

Make sure your `.env.local` has the correct values:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=TokenApp

# NextAuth Configuration
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Test the Configuration

#### Step 1: Restart Development Server
```bash
npm run dev
```

#### Step 2: Test OAuth Flow
1. Go to `http://localhost:3000/auth/signin`
2. Click the "Google" button
3. You should be redirected to Google's OAuth consent screen

### 5. Common Issues and Solutions

#### Issue: "redirect_uri_mismatch"
**Solution:** Ensure redirect URIs match exactly in both Google Cloud Console and Appwrite Console.

#### Issue: "invalid_client"
**Solution:** Check that your Google Client ID and Secret are correct.

#### Issue: "access_denied"
**Solution:** Check OAuth consent screen configuration and user permissions.

#### Issue: "precondition_failed"
**Solution:** This usually means the OAuth provider is not enabled or configured in Appwrite.

### 6. Debug Steps

#### Check Appwrite Console Logs
1. Go to your Appwrite Console
2. Navigate to **Logs**
3. Look for authentication-related errors

#### Check Browser Network Tab
1. Open browser developer tools
2. Go to Network tab
3. Try the OAuth flow
4. Look for failed requests and error details

#### Verify Environment Variables
Add this to your auth pages temporarily to debug:
```javascript
console.log('Environment check:', {
  appwriteEndpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  appwriteProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  nextauthUrl: process.env.NEXT_PUBLIC_NEXTAUTH_URL
});
```

### 7. Production Configuration

For production deployment, update:

#### Appwrite Console
- Add production redirect URIs:
```
https://yourdomain.com
https://yourdomain.com/auth/signin
https://yourdomain.com/user/dashboard
```

#### Google Cloud Console
- Add production redirect URIs
- Update OAuth consent screen for production

#### Environment Variables
```env
NEXT_PUBLIC_NEXTAUTH_URL=https://yourdomain.com
```

### 8. Security Best Practices

#### OAuth Security
- Use HTTPS in production
- Implement proper CORS settings
- Monitor OAuth usage
- Set up rate limiting

#### Environment Variables
- Never commit `.env.local` to version control
- Use different credentials for development and production
- Rotate secrets regularly

### 9. Testing Checklist

- [ ] Google OAuth provider enabled in Appwrite
- [ ] Google Client ID and Secret configured correctly
- [ ] Redirect URIs match in both Google and Appwrite
- [ ] OAuth consent screen configured
- [ ] Environment variables loaded correctly
- [ ] Development server restarted
- [ ] Browser cache cleared

### 10. Support Resources

- [Appwrite OAuth Documentation](https://appwrite.io/docs/authentication-oauth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Appwrite Discord](https://discord.gg/appwrite)

---

**Note:** The 412 error specifically indicates that the OAuth provider is not properly configured in Appwrite. Follow the steps above to enable and configure the Google OAuth provider correctly.

















