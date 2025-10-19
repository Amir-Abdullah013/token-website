'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

/**
 * WalletFeeReferralBanner Component
 * 
 * Displays a banner encouraging users to refer friends to waive the $2 wallet fee.
 * Only visible during the trial period (walletFeeProcessed = false && walletFeeWaived = false).
 * Automatically hides once the fee is processed or waived.
 */
export default function WalletFeeReferralBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkBannerVisibility();
  }, []);

  const checkBannerVisibility = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/wallet-fee-status');
      
      if (!response.ok) {
        // If there's an error, don't show the banner
        setShowBanner(false);
        return;
      }

      const data = await response.json();
      
      // Show banner only if:
      // 1. Fee is not processed yet (walletFeeProcessed = false)
      // 2. Fee is not waived yet (walletFeeWaived = false)
      // 3. Still in trial period (isPending = true)
      const shouldShow = 
        !data.walletFeeProcessed && 
        !data.walletFeeWaived && 
        data.isPending === true;
      
      setShowBanner(shouldShow);
    } catch (error) {
      console.error('Error checking wallet fee status:', error);
      setShowBanner(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReferNow = () => {
    router.push('referrals');
  };

  // Don't render anything while loading or if banner shouldn't show
  if (loading || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 shadow-sm">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <circle cx="16" cy="16" r="1" fill="currentColor" className="text-blue-600" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Content */}
            <div className="relative px-6 py-4 sm:px-8 sm:py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Message */}
                <div className="flex items-start sm:items-center gap-3 flex-1">
                  {/* Icon */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                    className="flex-shrink-0"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-2xl sm:text-3xl">💡</span>
                    </div>
                  </motion.div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                      Refer a friend within your first month and your one-time{' '}
                      <span className="font-bold text-blue-600 dark:text-blue-400">$2 wallet setup fee</span>
                      {' '}will be waived!
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Your friend needs to stake at least $20 to qualify
                    </p>
                  </div>
                </div>

                {/* Button */}
                <div className="flex-shrink-0 sm:ml-4">
                  <motion.button
                    onClick={handleReferNow}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    <svg 
                      className="w-5 h-5 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                      />
                    </svg>
                    Refer Now
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}




