'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Input, Loader, Toast } from '@/components';
import Layout from '../../../components/Layout';

export default function AdminTokenSupplyPage() {
  const [mintAmount, setMintAmount] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showMintForm, setShowMintForm] = useState(false);
  
  // State for data
  const [supplyData, setSupplyData] = useState(null);
  const [valueData, setValueData] = useState(null);
  const [mintHistory, setMintHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data function
  const fetchData = async () => {
    try {
      const [supplyResponse, valueResponse, historyResponse] = await Promise.all([
        fetch('/api/token-supply').then(res => res.json()),
        fetch('/api/token-value').then(res => res.json()),
        fetch('/api/admin/mint?limit=20').then(res => res.json())
      ]);

      if (supplyResponse.success) setSupplyData(supplyResponse);
      if (valueResponse.success) setValueData(valueResponse);
      if (historyResponse.success) setMintHistory(historyResponse);
      
      // Handle authentication errors gracefully
      if (historyResponse.error === 'Authentication required' || historyResponse.error === 'Admin access required') {
        console.warn('Admin access required for mint history');
        setMintHistory({ data: { mintHistory: [] } }); // Set empty array for mint history
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and set up intervals
  useEffect(() => {
    fetchData();
    
    // Set up intervals for live updates
    const supplyInterval = setInterval(() => {
      fetch('/api/token-supply').then(res => res.json()).then(data => {
        if (data.success) setSupplyData(data);
      });
    }, 5000);

    const valueInterval = setInterval(() => {
      fetch('/api/token-value').then(res => res.json()).then(data => {
        if (data.success) setValueData(data);
      });
    }, 10000);

    const historyInterval = setInterval(() => {
      fetch('/api/admin/mint?limit=20').then(res => res.json()).then(data => {
        if (data.success) {
          setMintHistory(data);
        } else if (data.error === 'Authentication required' || data.error === 'Admin access required') {
          console.warn('Admin access required for mint history');
          setMintHistory({ data: { mintHistory: [] } });
        }
      });
    }, 15000);

    return () => {
      clearInterval(supplyInterval);
      clearInterval(valueInterval);
      clearInterval(historyInterval);
    };
  }, []);

  const handleMint = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      setToast({
        type: 'error',
        message: 'Please enter a valid amount'
      });
      return;
    }

    setIsMinting(true);
    try {
      const response = await fetch('/api/admin/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(mintAmount) }),
      });

      const result = await response.json();

      if (result.success) {
        setToast({
          type: 'success',
          message: `Successfully minted ${parseFloat(mintAmount).toLocaleString()} tokens`
        });
        setMintAmount('');
        setShowMintForm(false);
        
        // Refresh all data
        fetchData();
      } else {
        setToast({
          type: 'error',
          message: result.error || 'Failed to mint tokens'
        });
      }
    } catch (error) {
      console.error('Minting error:', error);
      setToast({
        type: 'error',
        message: 'Failed to mint tokens'
      });
    } finally {
      setIsMinting(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Loader size="lg" />
            <p className="text-slate-300 mt-4">Loading token supply data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm rounded-lg p-8 border border-slate-600/30 shadow-xl">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent mb-4">Error Loading Data</h2>
            <p className="text-slate-300">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">Token Supply Dashboard</h1>
          <p className="text-slate-300">Monitor and manage token supply with real-time data</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Supply */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm font-medium">Total Supply</p>
                    <p className="text-2xl font-bold text-white">
                      {supplyData?.data ? formatNumber(supplyData.data.totalSupply) : 'Loading...'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg flex items-center justify-center border border-cyan-400/30">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Remaining Supply */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm font-medium">Remaining Supply</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {supplyData?.data ? formatNumber(supplyData.data.remainingSupply) : 'Loading...'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-lg flex items-center justify-center border border-emerald-400/30">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Usage Percentage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm font-medium">Usage</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {supplyData?.data ? `${supplyData.data.usagePercentage.toFixed(1)}%` : 'Loading...'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg flex items-center justify-center border border-amber-400/30">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                {supplyData?.data && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-700/50 rounded-full h-2 border border-slate-600/30">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-orange-400 h-2 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: `${supplyData.data.usagePercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Current Token Value */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm font-medium">Token Value</p>
                    <p className="text-2xl font-bold text-violet-400">
                      {valueData?.data ? formatCurrency(valueData.data.currentValue) : 'Loading...'}
                    </p>
                    {valueData?.data && (
                      <p className="text-xs text-slate-400 mt-1">
                        {valueData.data.inflationFactor.toFixed(2)}x inflation
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-lg flex items-center justify-center border border-violet-400/30">
                    <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Mint Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Mint New Tokens</h2>
                <Button
                  onClick={() => setShowMintForm(!showMintForm)}
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
                >
                  {showMintForm ? 'Cancel' : 'Mint Tokens'}
                </Button>
              </div>

              <AnimatePresence>
                {showMintForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-600/30 pt-4"
                  >
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-200 mb-2">
                          Amount to Mint
                        </label>
                        <Input
                          type="number"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          placeholder="Enter amount to mint"
                          className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 text-white placeholder-slate-300 placeholder-opacity-80 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
                          min="1"
                          step="1"
                        />
                      </div>
                      <Button
                        onClick={handleMint}
                        disabled={isMinting || !mintAmount}
                        className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30 disabled:opacity-50"
                      >
                        {isMinting ? (
                          <div className="flex items-center gap-2">
                            <Loader size="sm" />
                            Minting...
                          </div>
                        ) : (
                          'Mint Tokens'
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-300 mt-2">
                      This will increase both total supply and remaining supply by the specified amount.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* Mint History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-4">Mint History</h2>
              
              {!mintHistory?.data?.mintHistory ? (
                <div className="text-center py-8">
                  <Loader size="lg" />
                  <p className="text-slate-300 mt-2">Loading mint history...</p>
                </div>
              ) : mintHistory.data.mintHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-300">No mint history available</p>
                  <p className="text-slate-400 text-sm mt-2">
                    Admin access required to view mint history
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-600/30">
                        <th className="text-left text-slate-300 font-medium py-3 px-4">Date</th>
                        <th className="text-left text-slate-300 font-medium py-3 px-4">Admin</th>
                        <th className="text-right text-slate-300 font-medium py-3 px-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mintHistory.data.mintHistory.map((mint, index) => (
                        <motion.tr
                          key={mint.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-slate-600/20 hover:bg-slate-700/20 transition-colors duration-150"
                        >
                          <td className="py-3 px-4 text-slate-200">
                            {formatDate(mint.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-slate-200">
                            {mint.adminName || mint.adminEmail || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                            +{formatNumber(mint.amount)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Toast */}
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
    </Layout>
  );
}
