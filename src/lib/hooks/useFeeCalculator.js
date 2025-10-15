import { useMemo, useState, useEffect } from 'react';

/**
 * Custom hook for calculating transaction fees with dynamic rates
 * @param {string} type - Transaction type (transfer, withdraw, buy, sell)
 * @param {number} amount - Transaction amount
 * @returns {Object} Fee calculation result
 */
export function useFeeCalculator(type, amount) {
  const [feeRates, setFeeRates] = useState({
    transfer: 0.05,  // 5% default
    withdraw: 0.10,  // 10% default
    buy: 0.01,       // 1% default
    sell: 0.01,      // 1% default
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dynamic fee rates from API
  useEffect(() => {
    const fetchFeeRates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/fees');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.feeRates) {
            setFeeRates(data.feeRates);
            setError(null);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic fee rates, using defaults:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeRates();
    
    // Refresh rates every 30 seconds to get latest changes
    const interval = setInterval(fetchFeeRates, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculation = useMemo(() => {
    const rate = feeRates[type] ?? 0;
    const fee = amount * rate;
    const net = amount - fee;
    
    return {
      rate,
      fee: parseFloat(fee.toFixed(6)),
      net: parseFloat(net.toFixed(6)),
      originalAmount: amount,
      feePercentage: (rate * 100).toFixed(1),
      displayText: `${(rate * 100).toFixed(1)}% fee ($${fee.toFixed(2)})`,
      breakdown: {
        original: amount,
        fee: fee,
        net: net,
        percentage: rate * 100
      },
      loading,
      error
    };
  }, [type, amount, feeRates, loading, error]);

  return calculation;
}

/**
 * Hook for getting fee rates by transaction type
 * @returns {Object} Fee rates for all transaction types
 */
export function useFeeRates() {
  const [feeRates, setFeeRates] = useState({
    transfer: 0.05,  // 5% default
    withdraw: 0.10,  // 10% default
    buy: 0.01,       // 1% default
    sell: 0.01,      // 1% default
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeeRates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/fees');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.feeRates) {
            setFeeRates(data.feeRates);
            setError(null);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic fee rates, using defaults:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeRates();
    
    // Refresh rates every 30 seconds
    const interval = setInterval(fetchFeeRates, 30000);
    return () => clearInterval(interval);
  }, []);

  return { feeRates, loading, error };
}

/**
 * Hook for calculating fees with custom rates
 * @param {string} type - Transaction type
 * @param {number} amount - Transaction amount
 * @param {Object} customRates - Custom fee rates
 * @returns {Object} Fee calculation result
 */
export function useCustomFeeCalculator(type, amount, customRates = {}) {
  const defaultRates = {
    transfer: 0.05,
    withdraw: 0.10,
    buy: 0.01,
    sell: 0.01,
  };

  const rates = { ...defaultRates, ...customRates };

  const calculation = useMemo(() => {
    const rate = rates[type] ?? 0;
    const fee = amount * rate;
    const net = amount - fee;
    
    return {
      rate,
      fee: parseFloat(fee.toFixed(6)),
      net: parseFloat(net.toFixed(6)),
      originalAmount: amount,
      feePercentage: (rate * 100).toFixed(1),
      displayText: `${(rate * 100).toFixed(1)}% fee ($${fee.toFixed(2)})`,
      breakdown: {
        original: amount,
        fee: fee,
        net: net,
        percentage: rate * 100
      }
    };
  }, [type, amount, rates]);

  return calculation;
}

export default useFeeCalculator;
