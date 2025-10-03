// Environment configuration checker
export const config = {
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // NextAuth Configuration
  nextauth: {
    url: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
    secret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  },
  
  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }
  },
  
  // URLs
  urls: {
    base: process.env.NEXT_PUBLIC_NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
    signin: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/auth/signin` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/auth/signin` : '/auth/signin'),
    signup: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/auth/signup` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/auth/signup` : '/auth/signup'),
    dashboard: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/user/dashboard` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/user/dashboard` : '/user/dashboard'),
    adminDashboard: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/admin/dashboard` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/admin/dashboard` : '/admin/dashboard'),
    verifyEmail: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/auth/verify-email` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/auth/verify-email` : '/auth/verify-email'),
    resetPassword: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/auth/reset-password` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/auth/reset-password` : '/auth/reset-password'),
  }
};

// Validation function
export const validateConfig = () => {
  const errors = [];
  
  // Check required database variables
  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }
  
  // Check Google OAuth variables (only clientId is needed for client-side)
  if (!config.oauth.google.clientId) {
    errors.push('NEXT_PUBLIC_GOOGLE_CLIENT_ID is required for Google OAuth');
  }
  
  // Note: NEXT_PUBLIC_GOOGLE_CLIENT_SECRET is not needed for client-side OAuth
  // Note: NextAuth variables are not needed for Appwrite authentication
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Log configuration status (only in development)
if (process.env.NODE_ENV === 'development') {
  const validation = validateConfig();
  if (validation.isValid) {
    console.log('✅ All environment variables are properly configured');
  } else {
    console.warn('⚠️ Configuration issues found:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));
  }
}

export default config;






