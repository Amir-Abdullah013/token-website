'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';

const TikiContext = createContext();

export const useTiki = () => {
  const context = useContext(TikiContext);
  if (!context) {
    throw new Error('useTiki must be used within a TikiProvider');
  }
  return context;
};

export const TikiProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Initial state values
  const [usdBalance, setUsdBalance] = useState(0);
  const [tikiBalance, setTikiBalance] = useState(0);
  const [tikiPrice, setTikiPrice] = useState(0.0035);
  const [isLoading, setIsLoading] = useState(true);

  // Load user-specific data from API
  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Load user's wallet data from API
        const response = await fetch(`/api/wallet/balance?userId=${user.id}`);
        let data = null;
        
        if (response.ok) {
          data = await response.json();
          setUsdBalance(data.usdBalance || 0);
          setTikiBalance(data.tikiBalance || 0);
          setTikiPrice(data.tikiPrice || 0.0035);
        } else {
          // Set default values if API fails
          setUsdBalance(0);
          setTikiBalance(0);
          setTikiPrice(0.0035);
        }
        
        console.log('✅ User data loaded:', {
          userId: user.id,
          usdBalance: data?.usdBalance || 0,
          tikiBalance: data?.tikiBalance || 0,
          tikiPrice: data?.tikiPrice || 0.0035
        });
        
      } catch (error) {
        console.error('Error loading user data:', error);
        // Set default values on error
        setUsdBalance(0);
        setTikiBalance(0);
        setTikiPrice(0.0035);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated, user?.id]);

  // Currency conversion rates (simplified for demo)
  const currencyRates = {
    USD: 1,
    PKR: 0.0036, // 1 PKR = 0.0036 USD
    EUR: 1.08,   // 1 EUR = 1.08 USD
    GBP: 1.27,   // 1 GBP = 1.27 USD
    INR: 0.012,  // 1 INR = 0.012 USD
    CAD: 0.74,   // 1 CAD = 0.74 USD
    AUD: 0.66,   // 1 AUD = 0.66 USD
  };

  // Utility functions
  const convertToUSD = (amount, fromCurrency) => {
    const rate = currencyRates[fromCurrency] || 1;
    return amount * rate;
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const formatTiki = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(amount);
  };

  // Fetch user wallet data
  const fetchUserWallet = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/wallet/balance?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUsdBalance(data.usdBalance || 0);
        setTikiBalance(data.tikiBalance || 0);
        setTikiPrice(data.tikiPrice || 0.0035);
        console.log('✅ Wallet data refreshed:', data);
      } else {
        console.log('⚠️ Wallet API failed, using current state');
        // Keep current state if API fails
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      // Keep current state if API fails
    }
  };

  // Update database via API
  const updateDatabaseBalances = async (newUsdBalance, newTikiBalance) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/wallet/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          usdBalance: newUsdBalance,
          tikiBalance: newTikiBalance
        }),
      });
      
      if (response.ok) {
        console.log('✅ Database balances updated:', {
          userId: user.id,
          usdBalance: newUsdBalance,
          tikiBalance: newTikiBalance
        });
      }
    } catch (error) {
      console.error('Error updating database balances:', error);
    }
  };

  // Trading functions
  const depositUSD = async (amount, currency = 'USD') => {
    if (!user?.id) return 0;
    
    const usdAmount = convertToUSD(amount, currency);
    const newBalance = usdBalance + usdAmount;
    
    setUsdBalance(newBalance);
    await updateDatabaseBalances(newBalance, tikiBalance);
    
    return usdAmount;
  };

  const withdrawUSD = async (amount) => {
    if (!user?.id || amount > usdBalance) return false;
    
    const newBalance = usdBalance - amount;
    setUsdBalance(newBalance);
    await updateDatabaseBalances(newBalance, tikiBalance);
    
    return true;
  };

  const buyTiki = async (usdAmount) => {
    if (!user?.id || usdAmount > usdBalance) {
      return { success: false, error: 'Insufficient USD balance' };
    }

    try {
      // Call the buy API to get real-time price calculation
      const response = await fetch('/api/tiki/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          usdAmount: usdAmount
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update balances based on API response
        const newUsdBalance = usdBalance - usdAmount;
        const newTikiBalance = tikiBalance + data.transaction.tokensReceived;
        
        setUsdBalance(newUsdBalance);
        setTikiBalance(newTikiBalance);
        
        // Update database
        await updateDatabaseBalances(newUsdBalance, newTikiBalance);
        
        // Update price with the new calculated price
        setTikiPrice(data.priceUpdate.newPrice);
        
        return { 
          success: true, 
          tokensBought: data.transaction.tokensReceived,
          newPrice: data.priceUpdate.newPrice,
          oldPrice: data.priceUpdate.oldPrice
        };
      } else {
        return { success: false, error: data.error || 'Buy failed' };
      }
    } catch (error) {
      console.error('Buy API error:', error);
      // Fallback to local calculation
      const tokensToBuy = usdAmount / tikiPrice;
      const priceIncrease = usdAmount / 1000000;
      
      const newUsdBalance = usdBalance - usdAmount;
      const newTikiBalance = tikiBalance + tokensToBuy;
      
      setUsdBalance(newUsdBalance);
      setTikiBalance(newTikiBalance);
      setTikiPrice(Math.min(1, tikiPrice + priceIncrease));
      
      // Update database
      await updateDatabaseBalances(newUsdBalance, newTikiBalance);
      
      return { success: true, tokensBought: tokensToBuy };
    }
  };

  const sellTiki = async (tokenAmount) => {
    if (!user?.id || tokenAmount > tikiBalance) {
      return { success: false, error: 'Insufficient Tiki balance' };
    }

    try {
      // Call the sell API to get real-time price calculation
      const response = await fetch('/api/tiki/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          tokenAmount: tokenAmount
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update balances based on API response
        const newTikiBalance = tikiBalance - tokenAmount;
        const newUsdBalance = usdBalance + data.transaction.amount;
        
        setTikiBalance(newTikiBalance);
        setUsdBalance(newUsdBalance);
        
        // Update database
        await updateDatabaseBalances(newUsdBalance, newTikiBalance);
        
        // Update price with the new calculated price
        setTikiPrice(data.priceUpdate.newPrice);
        
        return { 
          success: true, 
          usdReceived: data.transaction.amount,
          newPrice: data.priceUpdate.newPrice,
          oldPrice: data.priceUpdate.oldPrice
        };
      } else {
        return { success: false, error: data.error || 'Sell failed' };
      }
    } catch (error) {
      console.error('Sell API error:', error);
      // Fallback to local calculation
      const usdReceived = tokenAmount * tikiPrice;
      const priceDecrease = usdReceived / 1000000;
      
      const newTikiBalance = tikiBalance - tokenAmount;
      const newUsdBalance = usdBalance + usdReceived;
      
      setTikiBalance(newTikiBalance);
      setUsdBalance(newUsdBalance);
      setTikiPrice(Math.max(0.0001, tikiPrice - priceDecrease));
      
      // Update database
      await updateDatabaseBalances(newUsdBalance, newTikiBalance);
      
      return { success: true, usdReceived };
    }
  };

  const getCurrencies = () => Object.keys(currencyRates);

  // Fetch current price from API with improved error handling
  const fetchCurrentPrice = async () => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return getFallbackPrice();
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/tiki/price', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.price && typeof data.price === 'number') {
        setTikiPrice(data.price);
        // Store in localStorage as backup
        localStorage.setItem('tikiPrice', data.price.toString());
        localStorage.setItem('tikiPriceTimestamp', Date.now().toString());
        return data.price;
      } else {
        console.warn('Price API returned invalid data:', data);
        return getFallbackPrice();
      }
    } catch (error) {
      // Only log error if it's not an abort (timeout)
      if (error.name !== 'AbortError') {
        console.warn('Price fetch failed, using fallback:', error.message);
      }
      return getFallbackPrice();
    }
  };

  // Get fallback price from localStorage or default
  const getFallbackPrice = () => {
    if (typeof window !== 'undefined') {
      const storedPrice = localStorage.getItem('tikiPrice');
      const storedTimestamp = localStorage.getItem('tikiPriceTimestamp');
      
      if (storedPrice && storedTimestamp) {
        const price = parseFloat(storedPrice);
        const timestamp = parseInt(storedTimestamp);
        const now = Date.now();
        
        // Use stored price if it's less than 1 hour old
        if (!isNaN(price) && price > 0 && (now - timestamp) < 3600000) {
          setTikiPrice(price);
          return price;
        }
      }
    }
    
    // Default fallback price - use current price if available, otherwise default
    const fallbackPrice = tikiPrice > 0 ? tikiPrice : 0.0035;
    setTikiPrice(fallbackPrice);
    return fallbackPrice;
  };

  const value = {
    // State values
    usdBalance,
    tikiBalance,
    tikiPrice,
    isLoading,
    
    // State setters
    setUsdBalance,
    setTikiBalance,
    setTikiPrice,
    
    // Trading functions
    depositUSD,
    withdrawUSD,
    buyTiki,
    sellTiki,
    
    // Utility functions
    convertToUSD,
    formatCurrency,
    formatTiki,
    getCurrencies,
    fetchCurrentPrice,
    fetchUserWallet,
    currencyRates
  };

  return (
    <TikiContext.Provider value={value}>
      {children}
    </TikiContext.Provider>
  );
};