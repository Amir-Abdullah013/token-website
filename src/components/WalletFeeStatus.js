'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * WalletFeeStatus Component
 * Displays wallet fee status to users on the dashboard
 * Shows trial period, due date, waiver status, or locked status
 */
export default function WalletFeeStatus() {
  const [feeStatus, setFeeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeeStatus();
  }, []);

  const fetchFeeStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/wallet-fee-status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallet fee status');
      }

      const data = await response.json();
      setFeeStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching wallet fee status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show anything if there's an error
  }

  if (!feeStatus) {
    return null;
  }

  const { 
    walletFeeProcessed, 
    walletFeeWaived, 
    walletFeeLocked, 
    walletFeeDueAt,
    daysRemaining,
    isPending
  } = feeStatus;

  // Don't show anything if fee is already processed and not locked
  if (walletFeeProcessed && !walletFeeLocked) {
    return null;
  }

  // Wallet Locked Status
  if (walletFeeLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-6 mb-6"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              ⚠️ Wallet Locked - Payment Required
            </h3>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              Your wallet features are currently locked. Please deposit at least <span className="font-bold">$2.00</span> to unlock your wallet and resume all wallet-related activities (send, buy, sell, deposit, withdraw, stake).
            </p>
            <div className="mt-4">
              <a
                href="/user/dashboard"
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Deposit Now
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Fee Waived Status (Show success message)
  if (walletFeeWaived) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg p-6 mb-6"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              ✅ Wallet Fee Waived!
            </h3>
            <p className="mt-2 text-sm text-green-700 dark:text-green-300">
              Congratulations! Your wallet fee has been permanently waived because you referred a user who staked at least $20 within 30 days. Enjoy unlimited access to all wallet features!
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Fee Already Charged
  if (walletFeeProcessed && !walletFeeWaived) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg p-6 mb-6"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              ✅ One-time Wallet Fee Charged
            </h3>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              A one-time wallet fee of $2.00 has been charged. You now have unlimited access to all wallet features.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Pending Status (Trial Period)
  if (isPending && walletFeeDueAt) {
    const dueDate = new Date(walletFeeDueAt);
    const formattedDate = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-6 mb-6"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              🎁 Free Trial Active - {daysRemaining} Days Remaining
            </h3>
            <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              You're currently in your 30-day free trial period. To avoid a one-time $2.00 wallet fee after your trial ends on <span className="font-bold">{formattedDate}</span>, refer a friend who stakes at least $20.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/user/dashboard?tab=referrals"
                className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Get Referral Link
              </a>
              <button
                onClick={() => {
                  const referralLink = `${window.location.origin}/auth/signup?ref=${feeStatus.userId}`;
                  navigator.clipboard.writeText(referralLink);
                  alert('Referral link copied to clipboard!');
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}











