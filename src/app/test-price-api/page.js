'use client';

import { useState, useEffect } from 'react';
import { useTiki } from '../../lib/tiki-context';

export default function TestPriceAPI() {
  const { tikiPrice, fetchCurrentPrice, buyTiki, sellTiki, usdBalance, tikiBalance, formatCurrency, formatTiki, depositUSD } = useTiki();
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { 
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      message, 
      type, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const testCurrentPrice = async () => {
    setIsLoading(true);
    addTestResult('🔍 Testing current price API...', 'info');
    
    try {
      const response = await fetch('/api/tiki/price');
      const data = await response.json();
      
      if (data.success) {
        addTestResult(`✅ Current Price: $${data.price.toFixed(6)}`, 'success');
        addTestResult(`📊 Total Investment: $${data.totalInvestment.toLocaleString()}`, 'info');
        addTestResult(`🪙 Total Tokens: ${data.totalTokens.toLocaleString()}`, 'info');
        addTestResult(`📈 Formula: $${data.totalInvestment.toLocaleString()} ÷ ${data.totalTokens.toLocaleString()} = $${data.price.toFixed(6)}`, 'info');
      } else {
        addTestResult(`❌ API Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Network Error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testPriceCalculation = async () => {
    setIsLoading(true);
    addTestResult('🧮 Testing price calculation formula...', 'info');
    
    try {
      const response = await fetch('/api/test-price-calculation');
      const data = await response.json();
      
      if (data.success) {
        addTestResult(`✅ Formula Test: ${data.allCorrect ? 'PASSED' : 'FAILED'}`, data.allCorrect ? 'success' : 'error');
        addTestResult(`📐 Formula: ${data.formula}`, 'info');
        
        data.results.forEach(result => {
          addTestResult(`${result.name}: ${result.formula} ${result.isCorrect ? '✅' : '❌'}`, result.isCorrect ? 'success' : 'error');
        });
      } else {
        addTestResult(`❌ Formula Test Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Formula Test Error: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const testBuyTransaction = async () => {
    if (usdBalance < 100) {
      addTestResult('❌ Insufficient USD balance for test. Please deposit first.', 'error');
      return;
    }

    setIsLoading(true);
    addTestResult('🛒 Testing buy transaction ($100)...', 'info');
    addTestResult(`Current USD Balance: ${formatCurrency(usdBalance)}`, 'info');
    addTestResult(`Current TIKI Balance: ${formatTiki(tikiBalance)}`, 'info');
    addTestResult(`Current Price: ${formatCurrency(tikiPrice)}`, 'info');
    
    try {
      addTestResult('📡 Calling buyTiki API...', 'info');
      const result = await buyTiki(100);
      addTestResult(`📦 API Response: ${JSON.stringify(result)}`, 'info');
      
      if (result && result.success) {
        addTestResult(`✅ Buy successful!`, 'success');
        addTestResult(`🪙 Tokens received: ${formatTiki(result.tokensBought)}`, 'info');
        addTestResult(`💰 Price before: $${result.oldPrice.toFixed(6)}`, 'info');
        addTestResult(`💰 Price after: $${result.newPrice.toFixed(6)}`, 'info');
        addTestResult(`📈 Price change: $${(result.newPrice - result.oldPrice).toFixed(6)}`, 'info');
      } else {
        addTestResult(`❌ Buy failed: ${result?.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Buy error: ${error.message}`, 'error');
      console.error('Buy transaction error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testSellTransaction = async () => {
    if (tikiBalance < 1000) {
      addTestResult('❌ Insufficient TIKI balance for test. Please buy some first.', 'error');
      return;
    }

    setIsLoading(true);
    addTestResult('💰 Testing sell transaction (1000 TIKI)...', 'info');
    addTestResult(`Current USD Balance: ${formatCurrency(usdBalance)}`, 'info');
    addTestResult(`Current TIKI Balance: ${formatTiki(tikiBalance)}`, 'info');
    addTestResult(`Current Price: ${formatCurrency(tikiPrice)}`, 'info');
    
    try {
      addTestResult('📡 Calling sellTiki API...', 'info');
      const result = await sellTiki(1000);
      addTestResult(`📦 API Response: ${JSON.stringify(result)}`, 'info');
      
      if (result && result.success) {
        addTestResult(`✅ Sell successful!`, 'success');
        addTestResult(`💵 USD received: ${formatCurrency(result.usdReceived)}`, 'info');
        addTestResult(`💰 Price before: $${result.oldPrice.toFixed(6)}`, 'info');
        addTestResult(`💰 Price after: $${result.newPrice.toFixed(6)}`, 'info');
        addTestResult(`📉 Price change: $${(result.newPrice - result.oldPrice).toFixed(6)}`, 'info');
      } else {
        addTestResult(`❌ Sell failed: ${result?.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ Sell error: ${error.message}`, 'error');
      console.error('Sell transaction error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTestBalance = () => {
    addTestResult('💰 Adding $1000 test balance...', 'info');
    try {
      // Use the depositUSD function from Tiki context
      const result = depositUSD(1000, 'USD');
      addTestResult(`✅ Added $1000 to USD balance!`, 'success');
      addTestResult(`New USD Balance: ${formatCurrency(usdBalance + 1000)}`, 'info');
    } catch (error) {
      addTestResult(`❌ Error adding balance: ${error.message}`, 'error');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🧪 Tiki Price System Test</h1>
          
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Current Price</h3>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(tikiPrice)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">USD Balance</h3>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(usdBalance)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">TIKI Balance</h3>
              <p className="text-2xl font-bold text-purple-900">{formatTiki(tikiBalance)}</p>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={testCurrentPrice}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              🔍 Test Current Price API
            </button>
            <button
              onClick={testPriceCalculation}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              🧮 Test Price Formula
            </button>
            <button
              onClick={addTestBalance}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              💰 Add Test Balance
            </button>
            <button
              onClick={testBuyTransaction}
              disabled={isLoading || usdBalance < 100}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              🛒 Test Buy ($100)
            </button>
            <button
              onClick={testSellTransaction}
              disabled={isLoading || tikiBalance < 1000}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              💰 Test Sell (1000 TIKI)
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              🗑️ Clear Results
            </button>
          </div>

          {/* Test Results */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 italic">No test results yet. Click a test button above to start.</p>
              ) : (
                testResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-2 rounded text-sm ${
                      result.type === 'success' ? 'bg-green-100 text-green-800' :
                      result.type === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <span className="text-xs text-gray-500">[{result.timestamp}]</span> {result.message}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">📋 Test Instructions</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>1. First, test the current price API to see the initial state</li>
              <li>2. Test a buy transaction to see price increase</li>
              <li>3. Test a sell transaction to see price decrease</li>
              <li>4. Watch how the price changes based on total investment</li>
              <li>5. The formula: <code>Price = Total Investment ÷ 100,000,000</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';

