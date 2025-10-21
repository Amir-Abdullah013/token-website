'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';

const VonContext = createContext();

export const useVon = () => {
  const context = useContext(VonContext);
  if (!context) {
    throw new Error('useVon must be used within a VonProvider');
  }
  return context;
};

export const VonProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Initial state values
  const [usdBalance, setUsdBalance] = useState(0);
  const [VonBalance, setVonBalance] = useState(0);
  const [VonPrice, setVonPrice] = useState(0.0035);
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
          setVonBalance(data.VonBalance || 0);
          setVonPrice(data.VonPrice || 0.0035);
        } else {
          // Set default values if API fails
          setUsdBalance(0);
          setVonBalance(0);
          setVonPrice(0.0035);
        }
        
        console.log('✅ User data loaded:', {
          userId: user.id,
          usdBalance: data?.usdBalance || 0,
          VonBalance: data?.VonBalance || 0,
          VonPrice: data?.VonPrice || 0.0035
        });
        
      } catch (error) {
        console.error('Error loading user data:', error);
        // Set default values on error
        setUsdBalance(0);
        setVonBalance(0);
        setVonPrice(0.0035);
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

  const formatVon = (amount) => {
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
        setVonBalance(data.VonBalance || 0);
        setVonPrice(data.VonPrice || 0.0035);
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
  const updateDatabaseBalances = async (newUsdBalance, newVonBalance) => {
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
          VonBalance: newVonBalance
        }),
      });
      
      if (response.ok) {
        console.log('✅ Database balances updated:', {
          userId: user.id,
          usdBalance: newUsdBalance,
          VonBalance: newVonBalance
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
    await updateDatabaseBalances(newBalance, VonBalance);
    
    return usdAmount;
  };

  const withdrawUSD = async (amount) => {
    if (!user?.id || amount > usdBalance) return false;
    
    const newBalance = usdBalance - amount;
    setUsdBalance(newBalance);
    await updateDatabaseBalances(newBalance, VonBalance);
    
    return true;
  };

  const buyVon = async (usdAmount) => {
    if (!user?.id || usdAmount > usdBalance) {
      return { success: false, error: 'Insufficient USD balance' };
    }

    try {
      // Call the buy API to get real-time price calculation
      const response = await fetch('/api/Von/buy', {
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
        const newVonBalance = VonBalance + data.transaction.tokensReceived;
        
        setUsdBalance(newUsdBalance);
        setVonBalance(newVonBalance);
        
        // Update database
        await updateDatabaseBalances(newUsdBalance, newVonBalance);
        
        // Update price with the new calculated price
        setVonPrice(data.priceUpdate.newPrice);
        
        console.log('🎉 Buy successful with price update:', {
          tokensBought: data.transaction.tokensReceived,
          oldPrice: data.priceUpdate.oldPrice,
          newPrice: data.priceUpdate.newPrice,
          priceIncrease: data.priceUpdate.priceIncrease
        });
        
        return { 
          success: true, 
          tokensBought: data.transaction.tokensReceived,
          newPrice: data.priceUpdate.newPrice,
          oldPrice: data.priceUpdate.oldPrice,
          priceIncrease: data.priceUpdate.priceIncrease
        };
      } else {
        return { success: false, error: data.error || 'Buy failed' };
      }
    } catch (error) {
      console.error('Buy API error:', error);
      // Fallback to local calculation (NO price increase - supply-based only)
      const tokensToBuy = usdAmount / VonPrice;
      
      const newUsdBalance = usdBalance - usdAmount;
      const newVonBalance = VonBalance + tokensToBuy;
      
      setUsdBalance(newUsdBalance);
      setVonBalance(newVonBalance);
      // Price is now controlled by supply-based calculation, not buy volume
      console.warn('⚠️ Using fallback buy calculation. Price not updated (supply-based economy).');
      
      // Update database
      await updateDatabaseBalances(newUsdBalance, newVonBalance);
      
      return { success: true, tokensBought: tokensToBuy };
    }
  };

  const sellVon = async (tokenAmount) => {
    if (!user?.id || tokenAmount > VonBalance) {
      return { success: false, error: 'Insufficient Von balance' };
    }

    try {
      // Call the sell API to get real-time price calculation
      const response = await fetch('/api/Von/sell', {
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
        const newVonBalance = VonBalance - tokenAmount;
        const newUsdBalance = usdBalance + data.transaction.amount;
        
        setVonBalance(newVonBalance);
        setUsdBalance(newUsdBalance);
        
        // Update database
        await updateDatabaseBalances(newUsdBalance, newVonBalance);
        
        // Update price with the new calculated price
        setVonPrice(data.priceUpdate.newPrice);
        
        console.log('🎉 Sell successful with price update:', {
          usdReceived: data.transaction.amount,
          oldPrice: data.priceUpdate.oldPrice,
          newPrice: data.priceUpdate.newPrice,
          priceDecrease: data.priceUpdate.priceDecrease
        });
        
        return { 
          success: true, 
          usdReceived: data.transaction.amount,
          newPrice: data.priceUpdate.newPrice,
          oldPrice: data.priceUpdate.oldPrice,
          priceDecrease: data.priceUpdate.priceDecrease
        };
      } else {
        return { success: false, error: data.error || 'Sell failed' };
      }
    } catch (error) {
      console.error('Sell API error:', error);
      // Fallback to local calculation (NO price decrease - supply-based only)
      const usdReceived = tokenAmount * VonPrice;
      
      const newVonBalance = VonBalance - tokenAmount;
      const newUsdBalance = usdBalance + usdReceived;
      
      setVonBalance(newVonBalance);
      setUsdBalance(newUsdBalance);
      // Price is now controlled by supply-based calculation, not sell volume
      console.warn('⚠️ Using fallback sell calculation. Price not updated (supply-based economy).');
      
      // Update database
      await updateDatabaseBalances(newUsdBalance, newVonBalance);
      
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

      const response = await fetch('/api/Von/price', {
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
        setVonPrice(data.price);
        // Store in localStorage as backup
        localStorage.setItem('VonPrice', data.price.toString());
        localStorage.setItem('VonPriceTimestamp', Date.now().toString());
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
      const storedPrice = localStorage.getItem('VonPrice');
      const storedTimestamp = localStorage.getItem('VonPriceTimestamp');
      
      if (storedPrice && storedTimestamp) {
        const price = parseFloat(storedPrice);
        const timestamp = parseInt(storedTimestamp);
        const now = Date.now();
        
        // Use stored price if it's less than 1 hour old
        if (!isNaN(price) && price > 0 && (now - timestamp) < 3600000) {
          setVonPrice(price);
          return price;
        }
      }
    }
    
    // Default fallback price - use current price if available, otherwise try to fetch dynamic price
    const fallbackPrice = VonPrice > 0 ? VonPrice : 0.0035;
    setVonPrice(fallbackPrice);
    
    // Try to fetch current price in background for next time
    if (VonPrice === 0.0035) {
      fetchCurrentPrice().catch(() => {
        // Silently fail - we already have a fallback
      });
    }
    
    return fallbackPrice;
  };

  const value = {
    // State values
    usdBalance,
    VonBalance,
    VonPrice,
    isLoading,
    
    // State setters
    setUsdBalance,
    setVonBalance,
    setVonPrice,
    
    // Trading functions
    depositUSD,
    withdrawUSD,
    buyVon,
    sellVon,
    
    // Utility functions
    convertToUSD,
    formatCurrency,
    formatVon,
    getCurrencies,
    fetchCurrentPrice,
    fetchUserWallet,
    currencyRates
  };

  return (
    <VonContext.Provider value={value}>
      {children}
    </VonContext.Provider>
  );
};