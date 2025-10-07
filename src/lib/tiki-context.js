'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const TikiContext = createContext();

export const useTiki = () => {
  const context = useContext(TikiContext);
  if (!context) {
    throw new Error('useTiki must be used within a TikiProvider');
  }
  return context;
};

export const TikiProvider = ({ children }) => {
  // Initial state values
  const [usdBalance, setUsdBalance] = useState(0);
  const [tikiBalance, setTikiBalance] = useState(0);
  const [tikiPrice, setTikiPrice] = useState(0.0035);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedUsdBalance = localStorage.getItem('tiki_usdBalance');
        const savedTikiBalance = localStorage.getItem('tiki_tikiBalance');
        const savedTikiPrice = localStorage.getItem('tiki_tikiPrice');

        if (savedUsdBalance !== null) {
          setUsdBalance(parseFloat(savedUsdBalance));
        }
        if (savedTikiBalance !== null) {
          setTikiBalance(parseFloat(savedTikiBalance));
        }
        if (savedTikiPrice !== null) {
          setTikiPrice(parseFloat(savedTikiPrice));
        }
      } catch (error) {
        console.error('Error loading Tiki data from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data to localStorage whenever values change
  useEffect(() => {
    if (!isLoading) {
      try {
        // Persist all trading data to localStorage for cross-page consistency
        localStorage.setItem('tiki_usdBalance', usdBalance.toString());
        localStorage.setItem('tiki_tikiBalance', tikiBalance.toString());
        localStorage.setItem('tiki_tikiPrice', tikiPrice.toString());
        localStorage.setItem('tiki_lastUpdated', new Date().toISOString());
        
        console.log('Tiki data saved to localStorage:', {
          usdBalance,
          tikiBalance,
          tikiPrice
        });
      } catch (error) {
        console.error('Error saving Tiki data to localStorage:', error);
      }
    }
  }, [usdBalance, tikiBalance, tikiPrice, isLoading]);

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

  // Trading functions
  const depositUSD = (amount, currency = 'USD') => {
    const usdAmount = convertToUSD(amount, currency);
    setUsdBalance(prev => prev + usdAmount);
    return usdAmount;
  };

  const withdrawUSD = (amount) => {
    if (amount <= usdBalance) {
      setUsdBalance(prev => prev - amount);
      return true;
    }
    return false;
  };

  const buyTiki = (usdAmount) => {
    if (usdAmount <= usdBalance) {
      const tokensToBuy = usdAmount / tikiPrice;
      const priceIncrease = usdAmount / 1000000;
      
      // Update balances
      setUsdBalance(prev => prev - usdAmount);
      setTikiBalance(prev => prev + tokensToBuy);
      
      // Update price (with limits)
      setTikiPrice(prev => Math.min(1, prev + priceIncrease));
      
      return { success: true, tokensBought: tokensToBuy };
    }
    return { success: false, error: 'Insufficient USD balance' };
  };

  const sellTiki = (tokenAmount) => {
    if (tokenAmount <= tikiBalance) {
      const usdReceived = tokenAmount * tikiPrice;
      const priceDecrease = usdReceived / 1000000;
      
      // Update balances
      setUsdBalance(prev => prev + usdReceived);
      setTikiBalance(prev => prev - tokenAmount);
      
      // Update price (with limits)
      setTikiPrice(prev => Math.max(0.0001, prev - priceDecrease));
      
      return { success: true, usdReceived };
    }
    return { success: false, error: 'Insufficient Tiki balance' };
  };

  const getCurrencies = () => Object.keys(currencyRates);

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
    currencyRates
  };

  return (
    <TikiContext.Provider value={value}>
      {children}
    </TikiContext.Provider>
  );
};