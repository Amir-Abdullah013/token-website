# Error Handling Guide

This guide explains the error handling system implemented in the Token Website project and how to resolve common errors.

## 🚨 **Common Errors & Solutions**

### 1. **Content Security Policy (CSP) Errors**

#### **Error**: `Refused to frame 'https://accounts.youtube.com/' because an ancestor violates the following Content Security Policy directive: "frame-ancestors 'self'"`

**Cause**: The CSP is blocking iframe embedding from external OAuth providers.

**Solution**: Updated CSP in `next.config.mjs` to allow OAuth providers:
```javascript
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://cloud.appwrite.io; frame-src 'self' https://accounts.google.com https://accounts.youtube.com;"
```

### 2. **OAuth Listener Errors**

#### **Error**: `Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received`

**Cause**: OAuth authentication flow interrupted or browser extension conflicts.

**Solutions**:
1. **Clear Browser Cache**: Clear browser cache and cookies
2. **Disable Extensions**: Temporarily disable browser extensions
3. **Check Network**: Ensure stable internet connection
4. **Retry Authentication**: Try the authentication flow again

### 3. **Missing Manifest File**

#### **Error**: `GET /manifest.json 404`

**Cause**: Missing web app manifest file.

**Solution**: Created `public/manifest.json` with proper PWA configuration.

### 4. **Metadata Configuration Warnings**

#### **Warning**: `Unsupported metadata viewport is configured in metadata export`

**Cause**: Using deprecated metadata configuration.

**Solution**: Updated to use separate `viewport` export:
```javascript
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};
```

## 🛠️ **Error Handling System**

### 1. **Error Boundary Component**

The `ErrorBoundary` component catches JavaScript errors anywhere in the component tree:

```javascript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features**:
- Catches JavaScript errors in child components
- Displays fallback UI instead of crashing
- Logs errors for debugging
- Provides retry functionality
- Shows error details in development mode

### 2. **Auth Error Boundary**

The `AuthErrorBoundary` specifically handles authentication-related errors:

```javascript
<AuthErrorBoundary>
  <AuthProvider>
    {children}
  </AuthProvider>
</AuthErrorBoundary>
```

### 3. **API Error Handling**

The `errorHandler` utility provides consistent error handling:

```javascript
import { errorHandler } from '@/lib/loading';

try {
  const result = await apiCall();
} catch (error) {
  const handledError = errorHandler.handleApiError(error, 'API call context');
  // Handle the error appropriately
}
```

## 🔧 **Error Prevention**

### 1. **Input Validation**

Always validate user input:

```javascript
const validateInput = (value) => {
  if (!value || value.trim() === '') {
    throw new Error('Input is required');
  }
  return value;
};
```

### 2. **Network Error Handling**

Handle network errors gracefully:

```javascript
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. **Loading States**

Always show loading states for async operations:

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  
  try {
    await submitData();
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## 📊 **Error Monitoring**

### 1. **Development Mode**

In development, errors are logged to console with detailed information:

```javascript
if (process.env.NODE_ENV === 'development') {
  console.error('Error details:', error, errorInfo);
}
```

### 2. **Production Mode**

In production, errors should be logged to external services:

```javascript
if (process.env.NODE_ENV === 'production') {
  // Log to external error reporting service
  logErrorToService(error, errorInfo);
}
```

### 3. **Performance Monitoring**

The `PerformanceMonitor` component tracks performance issues:

```javascript
<PerformanceMonitor />
```

## 🚀 **Best Practices**

### 1. **Error Boundaries**

Wrap components that might fail:

```javascript
<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

### 2. **Graceful Degradation**

Provide fallbacks for failed features:

```javascript
{featureAvailable ? (
  <AdvancedFeature />
) : (
  <BasicFeature />
)}
```

### 3. **User-Friendly Messages**

Show helpful error messages to users:

```javascript
const getErrorMessage = (error) => {
  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Please check your internet connection and try again.';
    case 'AUTH_ERROR':
      return 'Please sign in to continue.';
    default:
      return 'Something went wrong. Please try again.';
  }
};
```

### 4. **Retry Mechanisms**

Implement retry logic for transient errors:

```javascript
const retryOperation = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## 🔍 **Debugging Tips**

### 1. **Check Browser Console**

Always check the browser console for error messages and stack traces.

### 2. **Network Tab**

Check the Network tab in DevTools for failed requests.

### 3. **React DevTools**

Use React DevTools to inspect component state and props.

### 4. **Error Logging**

Implement comprehensive error logging:

```javascript
const logError = (error, context) => {
  console.error('Error in', context, ':', error);
  // Log to external service
  if (typeof window !== 'undefined') {
    window.gtag?.('event', 'exception', {
      description: error.message,
      fatal: false
    });
  }
};
```

## 📱 **Mobile-Specific Errors**

### 1. **Touch Events**

Handle touch events properly:

```javascript
const handleTouch = (e) => {
  e.preventDefault();
  // Handle touch
};
```

### 2. **Viewport Issues**

Ensure proper viewport configuration:

```javascript
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};
```

### 3. **Performance**

Monitor performance on mobile devices:

```javascript
const isMobile = () => window.innerWidth < 768;
const shouldUseLightweightVersion = isMobile() && navigator.connection?.effectiveType === 'slow-2g';
```

## 🎯 **Error Recovery**

### 1. **Automatic Recovery**

Implement automatic recovery for common errors:

```javascript
const recoverFromError = (error) => {
  if (error.code === 'NETWORK_ERROR') {
    // Retry automatically
    return retryOperation();
  }
  if (error.code === 'AUTH_ERROR') {
    // Redirect to login
    return redirectToLogin();
  }
  // Show error to user
  return showError(error);
};
```

### 2. **User Recovery**

Provide clear recovery options:

```javascript
const ErrorRecovery = ({ error, onRetry, onReload }) => (
  <div className="error-recovery">
    <p>Something went wrong: {error.message}</p>
    <button onClick={onRetry}>Try Again</button>
    <button onClick={onReload}>Reload Page</button>
  </div>
);
```

This comprehensive error handling system ensures a robust and user-friendly experience even when things go wrong.

























