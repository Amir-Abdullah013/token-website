/**
 * URL Utilities for robust detection of base URLs
 * Handles both development and production environments
 */

/**
 * Get the correct base URL for the current environment
 * @returns {string} The base URL (localhost for dev, Vercel URL for production)
 */
export function getBaseUrl() {
  // If NEXT_PUBLIC_NEXTAUTH_URL is set, use it (highest priority)
  if (process.env.NEXT_PUBLIC_NEXTAUTH_URL) {
    return process.env.NEXT_PUBLIC_NEXTAUTH_URL;
  }
  
  // In production on Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Fallback for other production environments (client-side)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Final fallback
  return 'http://localhost:3000';
}

/**
 * Get the OAuth callback URL for the current environment
 * @returns {string} The OAuth callback URL
 */
export function getOAuthCallbackUrl() {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/auth/oauth-callback`;
}

/**
 * Get the signin URL for the current environment
 * @returns {string} The signin URL
 */
export function getSigninUrl() {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/auth/signin`;
}

/**
 * Get the dashboard URL for the current environment
 * @returns {string} The dashboard URL
 */
export function getDashboardUrl() {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/user/dashboard`;
}

/**
 * Get the admin dashboard URL for the current environment
 * @returns {string} The admin dashboard URL
 */
export function getAdminDashboardUrl() {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/admin/dashboard`;
}

/**
 * Log current URL configuration (development only)
 */
export function logUrlConfig() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 URL Configuration:');
    console.log('  Base URL:', getBaseUrl());
    console.log('  OAuth Callback:', getOAuthCallbackUrl());
    console.log('  Signin URL:', getSigninUrl());
    console.log('  Dashboard URL:', getDashboardUrl());
    console.log('  Environment:', process.env.NODE_ENV);
    console.log('  Vercel URL:', process.env.VERCEL_URL || 'Not set');
    console.log('  NextAuth URL:', process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set');
  }
}
