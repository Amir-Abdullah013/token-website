# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication for your Next.js + Appwrite application.

## 1. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "TokenApp")
4. Click "Create"

### Step 2: Enable Google+ API
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity" API

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Enter a name (e.g., "TokenApp Web Client")

### Step 4: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required fields:
   - App name: "TokenApp"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
5. Add test users (for development)

### Step 5: Configure Authorized Redirect URIs
In your OAuth 2.0 Client ID settings, add these redirect URIs:

**For Development:**
```
http://localhost:3000
http://localhost:3000/auth/signin
http://localhost:3000/user/dashboard
```

**For Production:**
```
https://yourdomain.com
https://yourdomain.com/auth/signin
https://yourdomain.com/user/dashboard
```

## 2. Appwrite Console Setup

### Step 1: Configure OAuth Provider
1. Go to your [Appwrite Console](https://cloud.appwrite.io/)
2. Navigate to your project
3. Go to "Auth" → "Providers"
4. Find "Google" and click "Enable"

### Step 2: Add OAuth Credentials
1. In the Google provider settings, add:
   - **App ID**: Your Google Client ID
   - **App Secret**: Your Google Client Secret
2. Add the same redirect URIs as above
3. Save the configuration

### Step 3: Configure OAuth Scopes
In Appwrite, make sure these scopes are enabled:
- `email`
- `profile`
- `openid`

## 3. Environment Variables

Update your `.env.local` file with your Google OAuth credentials:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-appwrite-project-id

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 4. Testing OAuth Flow

### Development Testing
1. Start your development server: `npm run dev`
2. Navigate to `/auth/signin`
3. Click the "Google" button
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your app

### Production Testing
1. Deploy your application
2. Update the redirect URIs in Google Cloud Console
3. Update the redirect URIs in Appwrite Console
4. Test the OAuth flow on your production domain

## 5. Troubleshooting

### Common Issues:

#### "redirect_uri_mismatch" Error
- Ensure redirect URIs in Google Cloud Console match exactly
- Check for trailing slashes and HTTP vs HTTPS

#### "invalid_client" Error
- Verify your Google Client ID and Secret are correct
- Ensure the OAuth consent screen is properly configured

#### "access_denied" Error
- Check if the user has granted necessary permissions
- Verify OAuth scopes are correctly configured

#### Appwrite OAuth Not Working
- Ensure Google provider is enabled in Appwrite
- Check that redirect URIs match in both Google and Appwrite
- Verify your Appwrite project ID is correct

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are loaded
3. Test OAuth flow in incognito mode
4. Check Appwrite console logs

## 6. Security Best Practices

### Environment Variables
- Never commit `.env.local` to version control
- Use different OAuth credentials for development and production
- Rotate OAuth credentials regularly

### OAuth Configuration
- Use HTTPS in production
- Implement proper error handling
- Add rate limiting for OAuth requests
- Monitor OAuth usage and suspicious activity

### User Data Protection
- Only request necessary OAuth scopes
- Implement proper data retention policies
- Follow GDPR and privacy regulations

## 7. Additional OAuth Providers

You can also configure other OAuth providers:

### GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Add redirect URI: `https://yourdomain.com`
4. Configure in Appwrite Console

### Twitter OAuth
1. Go to Twitter Developer Portal
2. Create a new app
3. Configure OAuth 2.0 settings
4. Add redirect URI
5. Configure in Appwrite Console

## 8. Production Deployment

### Environment Variables
Set these in your production environment:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-production-project-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
```

### Domain Configuration
- Update all redirect URIs to use your production domain
- Ensure HTTPS is enabled
- Configure proper CORS settings if needed

## 9. Monitoring and Analytics

### OAuth Analytics
- Monitor OAuth success/failure rates
- Track user authentication patterns
- Set up alerts for unusual OAuth activity

### User Experience
- Monitor OAuth flow completion rates
- Track user drop-off points
- Optimize OAuth consent screen

## 10. Support and Resources

### Documentation
- [Appwrite OAuth Documentation](https://appwrite.io/docs/authentication-oauth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

### Community
- [Appwrite Discord](https://discord.gg/appwrite)
- [Google Cloud Community](https://cloud.google.com/community)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)

---

**Note**: Remember to replace placeholder values with your actual credentials and update the redirect URIs for your specific domain.












