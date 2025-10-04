/**
 * Environment Configuration for Supabase + Prisma
 * Handles all environment variables and provides fallbacks
 */

// Simple environment configuration - just use your database URL
const config = {
  // Database Configuration (using your database URL)
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tokenapp'
  },
  
  // OAuth Configuration (optional)
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || null
    }
  }
};

// Simple validation function
export const validateConfig = () => {
  const errors = [];
  const warnings = [];
  
  // Check database URL
  if (!config.database.url || config.database.url === 'postgresql://postgres:password@localhost:5432/tokenapp') {
    warnings.push('DATABASE_URL not set. Using default database URL.');
  }
  
  // Log warnings in development
  if (process.env.NODE_ENV === 'development') {
    warnings.forEach(warning => console.warn('⚠️', warning));
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Validate configuration on import
const validation = validateConfig();

export default config;
