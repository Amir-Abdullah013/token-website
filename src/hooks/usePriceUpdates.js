'use client';

import { useEffect, useRef } from 'react';
import { useTiki } from '../lib/tiki-context';

export function usePriceUpdates(interval = 5000) {
  const { fetchCurrentPrice } = useTiki();
  const intervalRef = useRef(null);

  useEffect(() => {
    // Fetch price immediately with error handling
    const fetchPrice = async () => {
      try {
        await fetchCurrentPrice();
      } catch (error) {
        console.warn('Failed to fetch initial price:', error);
      }
    };
    fetchPrice();

    // Set up interval for periodic updates
    intervalRef.current = setInterval(async () => {
      try {
        await fetchCurrentPrice();
      } catch (error) {
        console.warn('Failed to fetch price update:', error);
      }
    }, interval);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchCurrentPrice, interval]);

  return {
    startUpdates: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(fetchCurrentPrice, interval);
    },
    stopUpdates: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };
}





