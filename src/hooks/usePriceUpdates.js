'use client';

import { useEffect, useRef } from 'react';
import { useTiki } from '../lib/tiki-context';

export function usePriceUpdates(interval = 5000) {
  const { fetchCurrentPrice } = useTiki();
  const intervalRef = useRef(null);

  useEffect(() => {
    // Fetch price immediately
    fetchCurrentPrice();

    // Set up interval for periodic updates
    intervalRef.current = setInterval(() => {
      fetchCurrentPrice();
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





