// Loading states and error handling utilities
import { cache, cacheHelpers } from './cache';

// Loading state management
export class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.errorStates = new Map();
  }

  // Set loading state
  setLoading(key, isLoading = true) {
    this.loadingStates.set(key, isLoading);
  }

  // Get loading state
  isLoading(key) {
    return this.loadingStates.get(key) || false;
  }

  // Set error state
  setError(key, error = null) {
    this.errorStates.set(key, error);
  }

  // Get error state
  getError(key) {
    return this.errorStates.get(key);
  }

  // Clear states
  clear(key) {
    this.loadingStates.delete(key);
    this.errorStates.delete(key);
  }

  // Clear all states
  clearAll() {
    this.loadingStates.clear();
    this.errorStates.clear();
  }
}

// Global loading manager
export const loadingManager = new LoadingManager();

// Loading hook for React components
export const useLoading = (key) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startLoading = () => {
    setLoading(true);
    setError(null);
    loadingManager.setLoading(key, true);
    loadingManager.setError(key, null);
  };

  const stopLoading = () => {
    setLoading(false);
    loadingManager.setLoading(key, false);
  };

  const setErrorState = (error) => {
    setError(error);
    setLoading(false);
    loadingManager.setError(key, error);
    loadingManager.setLoading(key, false);
  };

  const clearError = () => {
    setError(null);
    loadingManager.setError(key, null);
  };

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setError: setErrorState,
    clearError
  };
};

// Error handling utilities
export const errorHandler = {
  // Handle API errors
  handleApiError(error, context = '') {
    console.error(`API Error ${context}:`, error);
    
    let message = 'An unexpected error occurred';
    let type = 'error';
    
    if (error.code === 401) {
      message = 'Please sign in to continue';
      type = 'auth';
    } else if (error.code === 403) {
      message = 'You do not have permission to perform this action';
      type = 'permission';
    } else if (error.code === 404) {
      message = 'The requested resource was not found';
      type = 'not_found';
    } else if (error.code === 429) {
      message = 'Too many requests. Please try again later';
      type = 'rate_limit';
    } else if (error.code >= 500) {
      message = 'Server error. Please try again later';
      type = 'server';
    } else if (error.message) {
      message = error.message;
    }
    
    return {
      message,
      type,
      code: error.code,
      context
    };
  },

  // Handle network errors
  handleNetworkError(error) {
    console.error('Network Error:', error);
    
    return {
      message: 'Network error. Please check your connection and try again',
      type: 'network',
      code: 'NETWORK_ERROR'
    };
  },

  // Handle validation errors
  handleValidationError(errors) {
    console.error('Validation Error:', errors);
    
    return {
      message: 'Please check your input and try again',
      type: 'validation',
      errors: errors
    };
  }
};

// Optimized API call wrapper
export const apiCall = async (key, fetchFn, options = {}) => {
  const {
    useCache = true,
    ttl = 5 * 60 * 1000, // 5 minutes
    retries = 3,
    retryDelay = 1000
  } = options;

  // Check cache first
  if (useCache) {
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
  }

  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fetchFn();
      
      // Cache the result
      if (useCache) {
        cache.set(key, result, ttl);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.code === 401 || error.code === 403 || error.code === 404) {
        throw error;
      }
      
      // Wait before retry
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
};

// Debounced API call
export const debouncedApiCall = (key, fetchFn, delay = 300) => {
  let timeoutId;
  
  return new Promise((resolve, reject) => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(async () => {
      try {
        const result = await apiCall(key, fetchFn);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, delay);
  });
};

// Batch API calls
export const batchApiCall = async (calls) => {
  const results = await Promise.allSettled(calls);
  
  return results.map((result, index) => ({
    index,
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
};

// Loading states for common operations
export const LOADING_KEYS = {
  USER_PROFILE: 'user_profile',
  USER_WALLET: 'user_wallet',
  USER_TRANSACTIONS: 'user_transactions',
  ADMIN_STATS: 'admin_stats',
  SYSTEM_SETTINGS: 'system_settings',
  NOTIFICATIONS: 'notifications',
  SUPPORT_TICKETS: 'support_tickets',
  PRICE_DATA: 'price_data',
  AUTH: 'auth',
  LOGOUT: 'logout'
};

// Error types
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  PERMISSION: 'permission',
  VALIDATION: 'validation',
  SERVER: 'server',
  NOT_FOUND: 'not_found',
  RATE_LIMIT: 'rate_limit',
  UNKNOWN: 'unknown'
};

export default {
  LoadingManager,
  loadingManager,
  useLoading,
  errorHandler,
  apiCall,
  debouncedApiCall,
  batchApiCall,
  LOADING_KEYS,
  ERROR_TYPES
};













