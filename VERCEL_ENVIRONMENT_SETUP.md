# Vercel Environment Variables Setup

This guide shows you exactly how to set up environment variables for your Vercel deployment.

## 🔧 **Required Environment Variables**

### 1. **In Vercel Dashboard**

Go to your Vercel project dashboard → Settings → Environment Variables and add:

```env
# Database Configuration
DATABASE_URL=your-database-connection-string

# Google OAuth Configuration  
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth Configuration
NEXT_PUBLIC_NEXTAUTH_URL=https://token-website-virid.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 2. **For Local Development (.env.local)**

Create a `.env.local` file in your project root:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth Configuration (for development)
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```

## 🚀 **How to Set Environment Variables in Vercel**

### Method 1: Vercel Dashboard
1. Go to your project dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables**
4. Add each variable with the correct value
5. Make sure to set them for **Production** environment

### Method 2: Vercel CLI
```bash
# Set environment variables via CLI
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add NEXT_PUBLIC_NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add DATABASE_URL
```

## 🔍 **Verification Steps**

### 1. Check Environment Variables
After setting variables, redeploy your project:
```bash
vercel --prod
```

### 2. Verify in Vercel Dashboard
- Go to your project → Settings → Environment Variables
- Confirm all variables are listed
- Check that they're set for the correct environment (Production)

### 3. Test OAuth Flow
1. Visit `https://token-website-virid.vercel.app/auth/signin`
2. Click "Sign in with Google"
3. Complete the OAuth flow
4. Verify you're redirected to the dashboard

## 🛠️ **Troubleshooting**

### Issue: Environment Variables Not Loading
**Solution**: 
1. Redeploy after setting variables: `vercel --prod`
2. Check variable names are exact (case-sensitive)
3. Ensure variables are set for Production environment

### Issue: OAuth Still Using Localhost URLs
**Solution**: 
1. Check that `NEXT_PUBLIC_NEXTAUTH_URL` is set to your Vercel URL
2. Verify `VERCEL_URL` is automatically set by Vercel
3. Redeploy the application

### Issue: "Failed to get access token" Error
**Solution**:
1. Verify Google Cloud Console has correct redirect URI
2. Check that environment variables are properly set
3. Ensure the application is using the correct base URL

## 📋 **Complete Checklist**

- [ ] All environment variables set in Vercel dashboard
- [ ] Variables set for Production environment
- [ ] Application redeployed after setting variables
- [ ] Google Cloud Console updated with Vercel URLs
- [ ] OAuth flow tested on production
- [ ] No console errors during OAuth flow

## 🔧 **Environment Variable Priority**

The application uses this priority order for URL detection:

1. `VERCEL_URL` (automatically set by Vercel)
2. `NEXT_PUBLIC_NEXTAUTH_URL` (manually set)
3. `NODE_ENV === 'development'` (localhost for dev)
4. Fallback to localhost

This ensures the application always uses the correct URL for the current environment.
