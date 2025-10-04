/**
 * Fallback configuration for when environment variables are not available
 * This prevents the app from crashing when DATABASE_URL is not set
 */

export const fallbackConfig = {
  database: {
    url: 'postgresql://postgres:password@localhost:5432/tokenapp',
    // This is a fallback URL that won't actually be used
    // The app will work without database connection for basic functionality
  },
  
  oauth: {
    google: {
      clientId: null,
      clientSecret: null,
    },
    github: {
      clientId: null,
      clientSecret: null,
    }
  },
  
  urls: {
    base: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    signin: '/auth/signin',
    signup: '/auth/signup',
    dashboard: '/user/dashboard',
    adminDashboard: '/admin/dashboard',
    verifyEmail: '/auth/verify-email',
    resetPassword: '/auth/reset-password',
  }
};

/**
 * Get configuration with fallbacks
 */
export function getConfigWithFallbacks() {
  return {
    database: {
      url: process.env.DATABASE_URL || process.env.DATABASE_URL || fallbackConfig.database.url,
    },
    
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || fallbackConfig.oauth.google.clientId,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || fallbackConfig.oauth.google.clientSecret,
      },
      github: {
        clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || fallbackConfig.oauth.github.clientId,
        clientSecret: process.env.GITHUB_CLIENT_SECRET || fallbackConfig.oauth.github.clientSecret,
      }
    },
    
    urls: {
      base: process.env.NEXT_PUBLIC_NEXTAUTH_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : fallbackConfig.urls.base),
      signin: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? 
              `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/auth/signin` : 
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/auth/signin` : fallbackConfig.urls.signin),
      signup: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? 
              `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/auth/signup` : 
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/auth/signup` : fallbackConfig.urls.signup),
      dashboard: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? 
                `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/user/dashboard` : 
                (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/user/dashboard` : fallbackConfig.urls.dashboard),
      adminDashboard: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? 
                     `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/admin/dashboard` : 
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/admin/dashboard` : fallbackConfig.urls.adminDashboard),
      verifyEmail: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? 
                   `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/auth/verify-email` : 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/auth/verify-email` : fallbackConfig.urls.verifyEmail),
      resetPassword: process.env.NEXT_PUBLIC_NEXTAUTH_URL ? 
                    `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/auth/reset-password` : 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/auth/reset-password` : fallbackConfig.urls.resetPassword),
    }
  };
}
