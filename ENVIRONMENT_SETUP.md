# Environment Variables Setup Guide

This guide will help you properly configure all environment variables for your Next.js + Supabase + Prisma authentication system.

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_DATABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Step-by-Step Configuration

### 1. Supabase Configuration

#### Get Supabase Project Details:
1. Go to [Supabase Dashboard](https://supabase.com/)
2. Create a new project or select existing project
3. Go to **Settings** → **API**
4. Copy your **Project URL**
5. Copy your **Anon Key**

#### Update your `.env.local`:
```env
NEXT_PUBLIC_DATABASE_URL=https://your-actual-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
```

### 2. Google OAuth Configuration

#### Create Google OAuth App:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** and **Google Identity API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)

#### Configure in Supabase:
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** provider
4. Add your Google Client ID and Secret
5. Add redirect URIs:
   - `http://localhost:3000`
   - `https://yourdomain.com`

#### Update your `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Complete Example `.env.local`

```env
# Supabase Configuration
NEXT_PUBLIC_DATABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

## Verification Steps

### 1. Check Configuration Status
The app includes a configuration status indicator that will show:
- ✅ **Green**: All variables are properly configured
- ❌ **Red**: Missing or invalid variables

### 2. Test Authentication Flow
1. Start your development server: `npm run dev`
2. Navigate to `/auth/signin`
3. Try the Google OAuth button
4. Test email/password signup and signin

### 3. Check Console Logs
Open browser developer tools and check for:
- Configuration validation messages
- Authentication errors
- OAuth redirect issues

## Troubleshooting

### Common Issues:

#### "Configuration Error" Message
- Check that all required variables are set
- Ensure no typos in variable names
- Restart your development server after changes

#### Google OAuth Not Working
- Verify Google Client ID and Secret are correct
- Check redirect URIs match exactly
- Ensure Google APIs are enabled
- Verify Appwrite Google provider is configured

#### Appwrite Connection Issues
- Verify Project ID is correct
- Check Appwrite endpoint URL
- Ensure project is active in Appwrite Console

#### NextAuth Issues
- Verify NEXTAUTH_URL matches your domain
- Check NEXTAUTH_SECRET is properly set
- Ensure secret is at least 32 characters

### Debug Commands:

```bash
# Check if environment variables are loaded
npm run dev

# Check specific variable
echo $NEXT_PUBLIC_APPWRITE_PROJECT_ID

# Validate configuration
node -e "console.log(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)"
```

## Production Deployment

### Environment Variables for Production:
```env
# Production .env.local
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-production-project-id
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=TokenApp-Production

NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret

NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
```

### Platform-Specific Setup:

#### Vercel:
1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all variables with production values

#### Netlify:
1. Go to **Site settings** → **Environment variables**
2. Add all variables with production values

#### Railway:
1. Go to your project dashboard
2. Navigate to **Variables** tab
3. Add all variables with production values

## Security Best Practices

### Environment Variables:
- Never commit `.env.local` to version control
- Use different secrets for development and production
- Rotate secrets regularly
- Use strong, random secrets

### OAuth Security:
- Use HTTPS in production
- Implement proper CORS settings
- Monitor OAuth usage
- Set up rate limiting

### Appwrite Security:
- Use proper API keys
- Implement user permissions
- Monitor authentication logs
- Set up security rules

## Support and Resources

### Documentation:
- [Appwrite Documentation](https://appwrite.io/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

### Community:
- [Appwrite Discord](https://discord.gg/appwrite)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Google Cloud Community](https://cloud.google.com/community)

---

**Note**: Replace all placeholder values with your actual credentials and ensure all URLs match your specific domain.








