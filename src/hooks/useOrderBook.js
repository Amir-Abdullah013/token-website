import { useState, useEffect, useCallback } from 'react';

export const useOrderBook = (interval = 10000) => {
  const [orderBook, setOrderBook] = useState({
    bids: [],
    asks: [],
    spread: { absolute: '0.0000', percentage: '0.00' },
    depth: { bidVolume: '0.00', askVolume: '0.00' },
    lastUpdate: null
  });
  
  const [recentTrades, setRecentTrades] = useState({
    trades: [],
    totalTrades: 0,
    lastUpdate: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderBookData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/order-book');
      const data = await response.json();
      
      if (data.success) {
        setOrderBook(data.data.orderBook);
        setRecentTrades(data.data.recentTrades);
      } else {
        // Use fallback data if API fails
        setOrderBook(data.data.orderBook);
        setRecentTrades(data.data.recentTrades);
        setError('Using fallback data - API unavailable');
      }
    } catch (err) {
      console.error('Order book fetch error:', err);
      setError('Failed to fetch order book data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrderBookData();
  }, [fetchOrderBookData]);

  // Set up interval for real-time updates
  useEffect(() => {
    const intervalId = setInterval(fetchOrderBookData, interval);
    return () => clearInterval(intervalId);
  }, [fetchOrderBookData, interval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true);
    fetchOrderBookData();
  }, [fetchOrderBookData]);

  // Helper functions
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(4);
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  const formatTotal = (total) => {
    return parseFloat(total).toFixed(2);
  };

  const formatPakistaniTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-PK', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatPakistaniDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-PK', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getPriceChangeColor = (type) => {
    return type === 'buy' ? 'text-emerald-400' : 'text-red-400';
  };

  const getPriceChangeIcon = (type) => {
    return type === 'buy' ? '↗' : '↘';
  };

  const getTradeTypeColor = (type) => {
    return type === 'buy' 
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
      : 'bg-red-500/20 text-red-300 border-red-400/30';
  };

  const getTradeTypeIcon = (type) => {
    return type === 'buy' ? '▲' : '▼';
  };

  const calculateSpread = () => {
    if (orderBook.bids.length === 0 || orderBook.asks.length === 0) return { absolute: '0.0000', percentage: '0.00' };
    
    const bestBid = parseFloat(orderBook.bids[0]?.price || 0);
    const bestAsk = parseFloat(orderBook.asks[0]?.price || 0);
    const spread = bestAsk - bestBid;
    const percentage = bestBid > 0 ? (spread / bestBid) * 100 : 0;
    
    return {
      absolute: spread.toFixed(4),
      percentage: percentage.toFixed(2)
    };
  };

  const getMarketDepth = () => {
    const bidVolume = orderBook.bids.reduce((sum, bid) => sum + parseFloat(bid.total || 0), 0);
    const askVolume = orderBook.asks.reduce((sum, ask) => sum + parseFloat(ask.total || 0), 0);
    
    return {
      bidVolume: bidVolume.toFixed(2),
      askVolume: askVolume.toFixed(2),
      totalVolume: (bidVolume + askVolume).toFixed(2)
    };
  };

  const getTopBids = (limit = 5) => {
    return orderBook.bids.slice(0, limit);
  };

  const getTopAsks = (limit = 5) => {
    return orderBook.asks.slice(0, limit);
  };

  const getRecentTradesList = (limit = 10) => {
    return recentTrades.trades.slice(0, limit);
  };

  const getTradeStats = () => {
    const trades = recentTrades.trades;
    if (trades.length === 0) return { buyCount: 0, sellCount: 0, totalVolume: 0, avgPrice: 0 };
    
    const buyTrades = trades.filter(trade => trade.type === 'buy');
    const sellTrades = trades.filter(trade => trade.type === 'sell');
    const totalVolume = trades.reduce((sum, trade) => sum + parseFloat(trade.total || 0), 0);
    const avgPrice = trades.reduce((sum, trade) => sum + parseFloat(trade.price || 0), 0) / trades.length;
    
    return {
      buyCount: buyTrades.length,
      sellCount: sellTrades.length,
      totalVolume: totalVolume.toFixed(2),
      avgPrice: avgPrice.toFixed(4)
    };
  };

  return {
    // Data
    orderBook,
    recentTrades,
    loading,
    error,
    
    // Actions
    refresh,
    
    // Helper functions
    formatPrice,
    formatAmount,
    formatTotal,
    formatPakistaniTime,
    formatPakistaniDateTime,
    getPriceChangeColor,
    getPriceChangeIcon,
    getTradeTypeColor,
    getTradeTypeIcon,
    calculateSpread,
    getMarketDepth,
    getTopBids,
    getTopAsks,
    getRecentTradesList,
    getTradeStats
  };
};
