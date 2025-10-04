import { getConfigWithFallbacks } from './fallback-config';

// Environment configuration checker with fallbacks
export const config = getConfigWithFallbacks();

// Validation function
export const validateConfig = () => {
  const errors = [];
  const warnings = [];
  
  // Check required database variables
  if (!config.database.url) {
    warnings.push('DATABASE_URL is not set - using fallback configuration');
  }
  
  // Check Google OAuth variables (only clientId is needed for client-side)
  if (!config.oauth.google.clientId) {
    warnings.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set - Google OAuth will be disabled');
  }
  
  // Note: GOOGLE_CLIENT_SECRET is not needed for client-side OAuth
  // Note: NextAuth variables are not needed for Appwrite authentication
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Log configuration status (only in development)
if (process.env.NODE_ENV === 'development') {
  const validation = validateConfig();
  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ All environment variables are properly configured');
  } else {
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:');
      validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    if (validation.errors.length > 0) {
      console.error('❌ Configuration errors:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
    }
  }
}

export default config;






