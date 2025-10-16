import { useState, useEffect, useCallback } from 'react';

export const useMarketData = (refreshInterval = 30000) => {
  const [marketData, setMarketData] = useState({
    price: 0,
    change24h: 0,
    volume24h: 0,
    high24h: 0,
    low24h: 0,
    marketCap: 0,
    circulatingMarketCap: 0,
    totalSupply: 1000000,
    circulatingSupply: 800000,
    tradeCount: 0,
    avgTradeSize: 0,
    lastUpdate: null,
    priceChange24h: 0,
    priceChangePercent: 0,
    volumeChange24h: 0,
    dominance: 0,
    rank: 1,
    allTimeHigh: 0,
    allTimeLow: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/market-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setMarketData(result.data);
        setLastFetch(new Date());
      } else {
        throw new Error(result.error || 'Failed to fetch market data');
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err.message);
      
      // Don't update market data on error, keep previous values
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Set up auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMarketData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMarketData, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Format currency helper
  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  };

  // Format number helper
  const formatNumber = (value, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  // Format percentage helper
  const formatPercentage = (value, decimals = 2) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  };

  // Get price change color
  const getPriceChangeColor = (change) => {
    return change >= 0 ? 'text-emerald-400' : 'text-red-400';
  };

  // Get price change icon
  const getPriceChangeIcon = (change) => {
    return change >= 0 ? '📈' : '📉';
  };

  // Get market status
  const getMarketStatus = () => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (marketData.price === 0) return 'no-data';
    return 'active';
  };

  return {
    marketData,
    loading,
    error,
    lastFetch,
    refresh,
    formatCurrency,
    formatNumber,
    formatPercentage,
    getPriceChangeColor,
    getPriceChangeIcon,
    getMarketStatus
  };
};
