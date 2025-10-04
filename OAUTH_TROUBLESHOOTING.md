# OAuth Authentication Troubleshooting Guide

This guide helps resolve common OAuth authentication issues in the Token Website project.

## 🔧 **OAuth Flow Architecture**

### **1. Authentication Flow**
```
User clicks "Sign in with Google" 
    ↓
Redirects to Google OAuth
    ↓
User authenticates with Google
    ↓
Google redirects to /auth/callback
    ↓
Callback page checks authentication
    ↓
Redirects to appropriate dashboard
```

### **2. Key Components**
- **Signin Page**: `/auth/signin` - Handles OAuth initiation
- **Callback Page**: `/auth/callback` - Handles OAuth response
- **Auth Context**: Manages authentication state
- **Middleware**: Protects routes and handles redirects

## 🚨 **Common Issues & Solutions**

### **Issue 1: Redirected to Signin Page After OAuth**

#### **Symptoms**:
- User completes Google OAuth
- Gets redirected back to signin page
- Not redirected to dashboard

#### **Root Causes**:
1. **OAuth Callback URL Mismatch**: Appwrite OAuth configured with wrong callback URL
2. **Auth Context Not Updated**: User session not detected after OAuth
3. **Middleware Redirect Loop**: Middleware redirecting authenticated users

#### **Solutions**:

**1. Update OAuth Callback URLs in Appwrite Console**:
```
Success URL: https://yourdomain.com/auth/callback
Failure URL: https://yourdomain.com/auth/signin
```

**2. Verify Environment Variables**:
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

**3. Check OAuth Provider Configuration**:
- Google OAuth provider enabled in Appwrite
- Correct client ID and secret configured
- Authorized redirect URIs include your domain

### **Issue 2: OAuth Callback Not Working**

#### **Symptoms**:
- OAuth redirects to callback page
- Callback page shows loading indefinitely
- User not authenticated

#### **Solutions**:

**1. Check Callback Page Logic**:
```javascript
// /auth/callback/page.js
useEffect(() => {
  const handleOAuthCallback = async () => {
    // Wait for auth context to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (isAuthenticated && user) {
      // Redirect to dashboard
      router.push('/user/dashboard');
    }
  };
  
  handleOAuthCallback();
}, [isAuthenticated, user]);
```

**2. Verify Auth Context Updates**:
```javascript
// Check if user is properly set after OAuth
console.log('User after OAuth:', user);
console.log('Is authenticated:', isAuthenticated);
```

### **Issue 3: Wrong Dashboard Redirect**

#### **Symptoms**:
- User authenticated successfully
- Redirected to wrong dashboard (user vs admin)

#### **Solutions**:

**1. Check User Role Detection**:
```javascript
// In callback page
const isAdmin = user.role === 'admin';
const dashboardUrl = isAdmin ? '/admin/dashboard' : '/user/dashboard';
router.push(dashboardUrl);
```

**2. Verify Role Assignment**:
- Check if user is added to admin team in Appwrite
- Verify role detection logic in auth context

### **Issue 4: Development vs Production Issues**

#### **Development Mode**:
- Mock user is set automatically
- OAuth might not work in development
- Check `NODE_ENV` environment variable

#### **Production Mode**:
- Real OAuth flow required
- Proper domain configuration needed
- HTTPS required for OAuth

## 🛠️ **Debugging Steps**

### **1. Check Browser Console**
```javascript
// Add debugging to auth context
console.log('Auth state:', { user, isAuthenticated, loading });
console.log('OAuth callback URL:', window.location.href);
```

### **2. Verify OAuth Configuration**
```javascript
// Check if OAuth is properly configured
const checkOAuthConfig = () => {
  console.log('Appwrite endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
  console.log('Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
  console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
};
```

### **3. Test OAuth Flow Manually**
1. Go to `/auth/signin`
2. Click "Sign in with Google"
3. Complete Google authentication
4. Check if redirected to `/auth/callback`
5. Verify user is authenticated
6. Check final redirect destination

### **4. Check Network Requests**
- Open browser DevTools → Network tab
- Look for OAuth-related requests
- Check for any failed requests
- Verify redirect URLs

## 🔧 **Configuration Checklist**

### **Appwrite Console Configuration**:
- [ ] Google OAuth provider enabled
- [ ] Correct client ID and secret
- [ ] Authorized redirect URIs configured
- [ ] Success URL: `https://yourdomain.com/auth/callback`
- [ ] Failure URL: `https://yourdomain.com/auth/signin`

### **Environment Variables**:
- [ ] `NEXT_PUBLIC_APPWRITE_ENDPOINT` set
- [ ] `NEXT_PUBLIC_APPWRITE_PROJECT_ID` set
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set
- [ ] All variables available in browser

### **Code Configuration**:
- [ ] OAuth functions use correct callback URL
- [ ] Callback page handles authentication properly
- [ ] Auth context updates after OAuth
- [ ] Middleware allows callback page access

## 🚀 **Testing OAuth Flow**

### **1. Local Development**:
```bash
# Start development server
npm run dev

# Test OAuth flow
# 1. Go to http://localhost:3000/auth/signin
# 2. Click "Sign in with Google"
# 3. Complete authentication
# 4. Verify redirect to /auth/callback
# 5. Check final redirect to dashboard
```

### **2. Production Testing**:
```bash
# Build and start production server
npm run build
npm start

# Test with production domain
# 1. Use HTTPS domain
# 2. Verify OAuth configuration
# 3. Test complete flow
```

## 📱 **Mobile OAuth Issues**

### **Common Mobile Issues**:
- OAuth popup blocked
- Redirect issues on mobile browsers
- Touch events not working

### **Solutions**:
```javascript
// Handle mobile OAuth
const handleMobileOAuth = () => {
  // Use full page redirect instead of popup
  window.location.href = oauthUrl;
};
```

## 🔍 **Advanced Debugging**

### **1. OAuth State Debugging**:
```javascript
// Add to auth context
const debugAuthState = () => {
  console.log('=== Auth State Debug ===');
  console.log('User:', user);
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Is Authenticated:', isAuthenticated);
  console.log('Is Admin:', isAdmin);
  console.log('Is User:', isUser);
};
```

### **2. OAuth Callback Debugging**:
```javascript
// Add to callback page
useEffect(() => {
  console.log('=== OAuth Callback Debug ===');
  console.log('Current URL:', window.location.href);
  console.log('Search params:', searchParams.toString());
  console.log('User state:', { user, isAuthenticated, loading });
}, [user, isAuthenticated, loading]);
```

### **3. Network Debugging**:
```javascript
// Monitor OAuth requests
const monitorOAuthRequests = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('oauth') || entry.name.includes('auth')) {
        console.log('OAuth request:', entry);
      }
    });
  });
  observer.observe({ entryTypes: ['navigation', 'resource'] });
};
```

## 🎯 **Best Practices**

### **1. OAuth Security**:
- Use HTTPS in production
- Validate OAuth state parameters
- Implement CSRF protection
- Secure callback URL handling

### **2. User Experience**:
- Show loading states during OAuth
- Handle OAuth errors gracefully
- Provide clear error messages
- Implement retry mechanisms

### **3. Error Handling**:
```javascript
const handleOAuthError = (error) => {
  console.error('OAuth Error:', error);
  
  if (error.code === 412) {
    return 'OAuth provider not configured';
  } else if (error.code === 401) {
    return 'OAuth authentication failed';
  } else {
    return 'OAuth error occurred';
  }
};
```

This comprehensive guide should help resolve OAuth authentication issues and ensure a smooth user experience.








