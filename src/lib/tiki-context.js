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

  // Fetch current price from API
  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch('/api/tiki/price');
      const data = await response.json();
      
      if (data.success) {
        setTikiPrice(data.price);
        return data.price;
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
    return tikiPrice; // Return current price if fetch fails
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
    currencyRates
  };

  return (
    <TikiContext.Provider value={value}>
      {children}
    </TikiContext.Provider>
  );
};