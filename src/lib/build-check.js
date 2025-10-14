/**
 * Utility to check if we're in build mode
 * This prevents database connections and external API calls during build time
 */

export function isBuildTime() {
  return process.env.NODE_ENV === 'production' && 
         (process.env.VERCEL_ENV === 'production' || 
          process.env.NEXT_PHASE === 'phase-production-build' ||
          process.env.NODE_ENV === 'build' ||
          process.env.BUILD_TIME === 'true');
}

export function shouldSkipDatabase() {
  return isBuildTime() || !process.env.DATABASE_URL || process.env.SKIP_DB === 'true';
}
