'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/admin-auth';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import { useToast, ToastContainer } from '@/components/Toast';
import { RefreshCw, DollarSign, TrendingUp, Users } from 'lucide-react';

export default function AdminPlansPage() {
  const { adminUser } = useAdminAuth();
  const { error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ totalPurchases: 0, totalVolume: 0, totalFees: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (adminUser) fetchPlans();
  }, [adminUser]);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/plans');
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
        setStats(data.statistics);
      } else {
        error(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error(err);
      error('Failed to load plan history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!mounted) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Plan Purchase Tracking
              </h1>
              <p className="mt-2 text-slate-300">
                Monitor investment plan purchases and platform fees.
              </p>
            </div>
            <Button onClick={fetchPlans} disabled={isLoading} className="bg-slate-700 hover:bg-slate-600">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-400/30">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 bg-indigo-500/30 rounded-lg mr-4">
                  <DollarSign className="h-6 w-6 text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-200">Total Volume</p>
                  <h2 className="text-2xl font-bold text-white">{formatCurrency(stats.totalVolume)}</h2>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-400/30">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 bg-emerald-500/30 rounded-lg mr-4">
                  <TrendingUp className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-200">Platform Fees Collected (30%)</p>
                  <h2 className="text-2xl font-bold text-white">{formatCurrency(stats.totalFees)}</h2>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 bg-cyan-500/30 rounded-lg mr-4">
                  <Users className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-cyan-200">Total Purchases</p>
                  <h2 className="text-2xl font-bold text-white">{stats.totalPurchases}</h2>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="bg-slate-800/40 border border-slate-600/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-600/30">
                  <thead className="bg-slate-700/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Plan Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Platform Fee (30%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-600/20 bg-slate-800/20">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No plan purchases found.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-700/20">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{tx.user_name || 'Unknown'}</div>
                            <div className="text-xs text-slate-400">{tx.user_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400">
                            {formatCurrency(tx.feeAmount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate">
                            {tx.description}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}

export const dynamic = 'force-dynamic';
