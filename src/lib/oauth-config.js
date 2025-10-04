/**
 * OAuth Configuration for both Development and Production
 * Handles localhost and Vercel deployment seamlessly
 */

import { getBaseUrl, getOAuthCallbackUrl } from './url-utils';

/**
 * Get OAuth configuration for the current environment
 */
export function getOAuthConfig() {
  const baseUrl = getBaseUrl();
  const callbackUrl = getOAuthCallbackUrl();
  
  // Environment detection
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isVercel = !!process.env.VERCEL_URL;
  const isProduction = !isDevelopment && isVercel;
  
  return {
    baseUrl,
    callbackUrl,
    isDevelopment,
    isVercel,
    isProduction,
    environment: isDevelopment ? 'development' : isProduction ? 'production' : 'unknown'
  };
}

/**
 * Get Google OAuth configuration
 */
export function getGoogleOAuthConfig() {
  const config = getOAuthConfig();
  
  return {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: config.callbackUrl,
    scope: 'openid email profile',
    responseType: 'code',
    accessType: 'offline',
    prompt: 'consent'
  };
}

/**
 * Validate OAuth configuration
 */
export function validateOAuthConfig() {
  const errors = [];
  const warnings = [];
  
  // Check Google OAuth
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    errors.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID is required');
  }
  
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    errors.push('GOOGLE_CLIENT_SECRET is required');
  }
  
  // Check environment-specific settings
  const config = getOAuthConfig();
  
  if (config.isProduction && !process.env.VERCEL_URL) {
    warnings.push('VERCEL_URL not detected in production environment');
  }
  
  if (config.isDevelopment && process.env.VERCEL_URL) {
    warnings.push('VERCEL_URL detected in development - this might cause issues');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

/**
 * Log OAuth configuration (development only)
 */
export function logOAuthConfig() {
  if (process.env.NODE_ENV === 'development') {
    const config = getOAuthConfig();
    const googleConfig = getGoogleOAuthConfig();
    const validation = validateOAuthConfig();
    
    console.log('🔧 OAuth Configuration:');
    console.log('  Environment:', config.environment);
    console.log('  Base URL:', config.baseUrl);
    console.log('  Callback URL:', config.callbackUrl);
    console.log('  Google Client ID:', googleConfig.clientId ? '✅ Set' : '❌ Missing');
    console.log('  Google Client Secret:', googleConfig.clientSecret ? '✅ Set' : '❌ Missing');
    console.log('  Vercel URL:', process.env.VERCEL_URL || 'Not set');
    console.log('  NextAuth URL:', process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set');
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    if (validation.errors.length > 0) {
      console.error('❌ Errors:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
    }
  }
}
