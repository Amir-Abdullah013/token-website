'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin-auth';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useToast, ToastContainer } from '@/components/Toast';

export default function AdminFeesPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // State for fee statistics
  const [feeStats, setFeeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: ''
  });

  // Chart data state
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else {
        fetchFeeStats();
      }
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  const fetchFeeStats = async () => {
    setLoading(true);
    setErrorState(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.type) queryParams.append('type', filters.type);

      const response = await fetch(`/api/admin/fees/summary?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fee statistics: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setFeeStats(data.summary);
        
        // Prepare chart data for daily fees
        const chartData = data.summary.daily_fees.map(item => ({
          date: item.date,
          fees: parseFloat(item.daily_fees),
          transactions: parseInt(item.daily_transactions)
        }));
        setChartData(chartData);
      } else {
        throw new Error(data.error || 'Failed to load fee statistics');
      }
    } catch (err) {
      console.error('Error fetching fee statistics:', err);
      setErrorState(err.message || 'Failed to load fee statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchFeeStats();
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: ''
    });
    fetchFeeStats();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTokens = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' Von';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!mounted || isLoading) {
    return (
      <Layout showSidebar={true}>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (errorState) {
    return (
      <Layout showSidebar={true}>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <div className="text-red-400 text-4xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-white mb-2">Error Loading Fee Statistics</h3>
            <p className="text-slate-300 mb-4">{errorState}</p>
            <Button onClick={fetchFeeStats} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-6">
            Fee Analytics Dashboard
          </h1>

          {/* Filters */}
          <Card className="mb-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all duration-200 hover:border-slate-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all duration-200 hover:border-slate-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fee Type Filter
                  </label>
                  <div className="relative">
                    <select
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400 transition-all duration-200 hover:border-slate-400/50 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-800 text-white py-2">All Fee Types</option>
                      <option value="transfer" className="bg-slate-800 text-white py-2">🔄 Transfer Fees (5%)</option>
                      <option value="withdraw" className="bg-slate-800 text-white py-2">💸 Withdrawal Fees (10%)</option>
                      <option value="buy" className="bg-slate-800 text-white py-2">📈 Buy Fees (1%)</option>
                      <option value="sell" className="bg-slate-800 text-white py-2">📉 Sell Fees (1%)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-end space-x-3">
                  <Button
                    onClick={applyFilters}
                    className="flex-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30 transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                      </svg>
                      Apply Filters
                    </div>
                  </Button>
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                    className="flex-1 bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30 transition-all duration-200 hover:scale-105"
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading fee statistics...</p>
            </div>
          ) : feeStats ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-lg">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-emerald-200">Total Fees Collected</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(feeStats.total_fees)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg">
                        <span className="text-2xl">📊</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-cyan-200">Total Transactions</p>
                        <p className="text-2xl font-bold text-white">{feeStats.total_transactions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-pink-500/20 border border-violet-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-lg">
                        <span className="text-2xl">📈</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-violet-200">Avg Fee per Transaction</p>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(feeStats.total_fees / Math.max(feeStats.total_transactions, 1))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-amber-200">Transaction Types</p>
                        <p className="text-2xl font-bold text-white">{feeStats.breakdown.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* NEW SECTION 1: Token Fees */}
              {feeStats.token_fees && (
                <Card className="mb-6 bg-gradient-to-br from-blue-800/40 via-indigo-700/30 to-blue-800/40 border border-blue-600/30 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        🪙 Token Fees (Send Tokens Only)
                      </CardTitle>
                      <div className="text-sm text-slate-400">
                        Current Price: {formatCurrency(feeStats.token_fees.current_token_price)} per Von
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Token Fees Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-4 rounded-lg border border-blue-500/30">
                        <p className="text-sm font-medium text-blue-200 mb-1">Total Token Fees</p>
                        <p className="text-2xl font-bold text-white">{formatTokens(feeStats.token_fees.total_fees_tokens)}</p>
                        <p className="text-xs text-slate-400 mt-1">≈ {formatCurrency(feeStats.token_fees.total_fees_usd)}</p>
                      </div>
                      <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-4 rounded-lg border border-indigo-500/30">
                        <p className="text-sm font-medium text-indigo-200 mb-1">Total Transactions</p>
                        <p className="text-2xl font-bold text-white">{feeStats.token_fees.total_transactions}</p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-4 rounded-lg border border-purple-500/30">
                        <p className="text-sm font-medium text-purple-200 mb-1">Avg Fee per Transaction</p>
                        <p className="text-2xl font-bold text-white">
                          {formatTokens(feeStats.token_fees.total_fees_tokens / Math.max(feeStats.token_fees.total_transactions, 1))}
                        </p>
                      </div>
                    </div>

                    {/* Token Fees Breakdown Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-600/30">
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Fee Rate</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Total Fees (Tokens)</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Transactions</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Avg Fee (Tokens)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-600/20">
                          {feeStats.token_fees.breakdown.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-700/20 transition-colors duration-150">
                              <td className="py-3 px-4 text-sm text-white capitalize flex items-center">
                                {item.transactionType === 'transfer' && '🔄 '}
                                {item.transactionType}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-300">{item.fee_percentage}</td>
                              <td className="py-3 px-4 text-sm text-blue-400 font-medium">
                                {formatTokens(item.total_fees_tokens)}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-300">{item.transaction_count}</td>
                              <td className="py-3 px-4 text-sm text-slate-300">
                                {formatTokens(item.avg_fee_tokens)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* NEW SECTION 2: Dollar Fees */}
              {feeStats.dollar_fees && (
                <Card className="mb-6 bg-gradient-to-br from-green-800/40 via-emerald-700/30 to-green-800/40 border border-green-600/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      💵 Dollar Fees (Buy, Sell, Withdrawals + Wallet Fee)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Dollar Fees Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-4 rounded-lg border border-green-500/30">
                        <p className="text-sm font-medium text-green-200 mb-1">Total Dollar Fees</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(feeStats.dollar_fees.total_fees)}</p>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-4 rounded-lg border border-emerald-500/30">
                        <p className="text-sm font-medium text-emerald-200 mb-1">Total Transactions</p>
                        <p className="text-2xl font-bold text-white">{feeStats.dollar_fees.total_transactions}</p>
                      </div>
                      <div className="bg-gradient-to-r from-teal-600/20 to-cyan-600/20 p-4 rounded-lg border border-teal-500/30">
                        <p className="text-sm font-medium text-teal-200 mb-1">Avg Fee per Transaction</p>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(feeStats.dollar_fees.total_fees / Math.max(feeStats.dollar_fees.total_transactions, 1))}
                        </p>
                      </div>
                    </div>

                    {/* Dollar Fees Breakdown Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-600/30">
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Fee Rate</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Total Fees (USD)</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Transactions</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Avg Fee (USD)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-600/20">
                          {feeStats.dollar_fees.breakdown.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-700/20 transition-colors duration-150">
                              <td className="py-3 px-4 text-sm text-white capitalize flex items-center">
                                {item.transactionType === 'buy' && '📈 '}
                                {item.transactionType === 'sell' && '📉 '}
                                {item.transactionType === 'withdraw' && '💸 '}
                                {item.transactionType === 'wallet_fee' && '💳 '}
                                {item.transactionType === 'withdraw' ? 'Withdrawal' : 
                                 item.transactionType === 'wallet_fee' ? 'Wallet Fee' : 
                                 item.transactionType}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-300">{item.fee_percentage}</td>
                              <td className="py-3 px-4 text-sm text-green-400 font-medium">
                                {formatCurrency(item.total_fees)}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-300">{item.transaction_count}</td>
                              <td className="py-3 px-4 text-sm text-slate-300">
                                {formatCurrency(item.avg_fee)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              
              
              {/* Daily Fees Chart */}
              <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Daily Fee Collection (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chartData.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-lg border border-slate-600/30">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-slate-300">{formatDate(item.date)}</div>
                          <div className="text-sm text-slate-400">{item.transactions} transactions</div>
                        </div>
                        <div className="text-sm font-medium text-emerald-400">
                          {formatCurrency(item.fees)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';
