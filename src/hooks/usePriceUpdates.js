'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useVon } from '@/lib/Von-context';

export function usePriceUpdates(interval = 10000) {
  const { fetchCurrentPrice } = useVon();
  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Memoized fetch function with retry logic
  const fetchPriceWithRetry = useCallback(async () => {
    try {
      await fetchCurrentPrice();
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      retryCountRef.current += 1;
      
      if (retryCountRef.current <= maxRetries) {
        console.warn(`Price fetch failed (attempt ${retryCountRef.current}/${maxRetries}):`, error.message);
        // Exponential backoff: wait longer between retries
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
        setTimeout(() => fetchPriceWithRetry(), backoffDelay);
      } else {
        console.warn('Max retries reached for price updates, using fallback price');
        retryCountRef.current = 0; // Reset for next cycle
      }
    }
  }, [fetchCurrentPrice]);

  useEffect(() => {
    // Fetch price immediately
    fetchPriceWithRetry();

    // Set up interval for periodic updates (only if interval > 0)
    if (interval > 0) {
      intervalRef.current = setInterval(fetchPriceWithRetry, interval);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchPriceWithRetry, interval]);

  return {
    startUpdates: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (interval > 0) {
        intervalRef.current = setInterval(fetchPriceWithRetry, interval);
      }
    },
    stopUpdates: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
    fetchNow: fetchPriceWithRetry
  };
}





