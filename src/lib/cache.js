// Cache management for optimized API calls
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  // Set cache with TTL
  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  // Get cache value
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  // Clear specific cache
  clear(key) {
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll() {
    this.cache.clear();
  }

  // Check if cache exists and is valid
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Get cache size
  size() {
    return this.cache.size;
  }
}

// Global cache instance
export const cache = new CacheManager();

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  USER_WALLET: 'user_wallet',
  USER_TRANSACTIONS: 'user_transactions',
  ADMIN_STATS: 'admin_stats',
  SYSTEM_SETTINGS: 'system_settings',
  NOTIFICATIONS: 'notifications',
  SUPPORT_TICKETS: 'support_tickets',
  PRICE_DATA: 'price_data'
};

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,    // 1 minute
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 15 * 60 * 1000,    // 15 minutes
  VERY_LONG: 60 * 60 * 1000 // 1 hour
};

// Cache helper functions
export const cacheHelpers = {
  // Get cached data or fetch and cache
  async getOrFetch(key, fetchFn, ttl = CACHE_TTL.MEDIUM) {
    const cached = cache.get(key);
    if (cached) return cached;

    try {
      const data = await fetchFn();
      cache.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Cache fetch error for ${key}:`, error);
      throw error;
    }
  },

  // Invalidate cache
  invalidate(key) {
    cache.clear(key);
  },

  // Invalidate multiple caches
  invalidateMultiple(keys) {
    keys.forEach(key => cache.clear(key));
  },

  // Invalidate user-related caches
  invalidateUserCaches() {
    const userKeys = [
      CACHE_KEYS.USER_PROFILE,
      CACHE_KEYS.USER_WALLET,
      CACHE_KEYS.USER_TRANSACTIONS,
      CACHE_KEYS.NOTIFICATIONS,
      CACHE_KEYS.SUPPORT_TICKETS
    ];
    this.invalidateMultiple(userKeys);
  },

  // Invalidate admin-related caches
  invalidateAdminCaches() {
    const adminKeys = [
      CACHE_KEYS.ADMIN_STATS,
      CACHE_KEYS.SYSTEM_SETTINGS,
      CACHE_KEYS.SUPPORT_TICKETS
    ];
    this.invalidateMultiple(adminKeys);
  }
};

// Cache middleware for API routes
export const withCache = (handler, ttl = CACHE_TTL.MEDIUM) => {
  return async (req, res) => {
    const cacheKey = `api_${req.url}_${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    try {
      const result = await handler(req, res);
      if (result && !res.headersSent) {
        cache.set(cacheKey, result, ttl);
        return res.json(result);
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
      throw error;
    }
  };
};

export default cache;


























