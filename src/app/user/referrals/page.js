'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { 
  Copy, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function ReferralDashboard() {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  const referralLink = user ? `${window.location.origin}/auth/signup?ref=${user.id}` : '';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      showToast('Referral link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  const fetchReferralData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/referrals/${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setReferralData(data);
      } else {
        setError(data.error || 'Failed to fetch referral data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [user?.id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
            <p className="text-slate-300">Please sign in to view your referral dashboard.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Your Referral Dashboard ✨
          </h1>
          <p className="text-slate-300">
            Track your referrals and earnings from your network
          </p>
        </motion.div>

        {/* Premium Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm rounded-xl shadow-xl border border-slate-600/30 p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Your Referral Link
              </h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="flex-1 w-full bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-600/30">
                  <code className="text-sm text-slate-200 break-all">
                    {referralLink}
                  </code>
                </div>
                <button
                  onClick={copyReferralLink}
                  disabled={!referralLink}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 w-full sm:w-auto ${
                    copied
                      ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30 shadow-lg shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30 disabled:bg-slate-600/50 disabled:cursor-not-allowed'
                  }`}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm rounded-xl shadow-xl border border-slate-600/30 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-600/50 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-slate-600/50 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-gradient-to-br from-red-500/20 via-rose-500/20 to-pink-500/20 border border-red-400/30 backdrop-blur-sm rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <h3 className="text-red-300 font-medium">Error Loading Data</h3>
                <p className="text-red-200 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={fetchReferralData}
                className="ml-auto bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 text-red-300 border border-red-400/30 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Premium Total Earnings */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30 backdrop-blur-sm rounded-xl shadow-xl hover:scale-105 transition-all duration-300 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-200 text-sm font-medium">Total Referral Earnings</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {(referralData?.totalEarnings || 0)} Von
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-cyan-300" />
              </div>
            </motion.div>

            {/* Premium Total Referrals */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 backdrop-blur-sm rounded-xl shadow-xl hover:scale-105 transition-all duration-300 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-200 text-sm font-medium">Total Referrals</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {referralData?.referralCount || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-emerald-300" />
              </div>
            </motion.div>

            {/* Premium Average Earnings */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 backdrop-blur-sm rounded-xl shadow-xl hover:scale-105 transition-all duration-300 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-200 text-sm font-medium">Avg. Earnings per Referral</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {(referralData?.statistics?.averageEarningPerReferral || 0)} Von
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-300" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Premium Referred Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm rounded-xl shadow-xl border border-slate-600/30 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-600/30">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Referred Users</h3>
            <p className="text-slate-300 text-sm mt-1">
              Track your referrals and their staking activity
            </p>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-slate-600/50 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300">Failed to load referral data</p>
            </div>
          ) : !referralData?.referrals?.length ? (
            <div className="p-6 text-center">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Referrals Yet</h3>
              <p className="text-slate-300 mb-4">
                Share your referral link to start earning from your network!
              </p>
              <button
                onClick={copyReferralLink}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all duration-300"
              >
                Copy Referral Link
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700/30 to-slate-800/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Signup Date
                    </th>
                    
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Your Earnings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/30">
                  {referralData.referrals.map((referral, index) => (
                    <motion.tr
                      key={referral.referredUser}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="hover:bg-slate-700/20 transition-colors duration-300"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-400/30">
                            <span className="text-cyan-300 font-medium text-sm">
                              {referral.referredName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {referral.referredName || 'Unknown User'}
                            </div>
                            <div className="text-sm text-slate-300">
                              {referral.referredEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-white">
                          <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                          {formatDate(referral.signupDate)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-emerald-400">
                          {(referral.earningFromThisUser)} Von
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Premium Toast Notification */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-xl z-50 backdrop-blur-sm border ${
              toast.type === 'success' 
                ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-400/30 shadow-emerald-500/25' 
                : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-red-400/30 shadow-red-500/25'
            }`}
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </Layout>
  );
}
