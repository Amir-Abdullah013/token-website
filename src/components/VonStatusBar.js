'use client';

import { useVon } from '@/lib/Von-context';

const VonStatusBar = () => {
  const { usdBalance, VonBalance, lockedPlanTokensAmount, VonPrice, formatCurrency, formatVon, isLoading } = useVon();

  // Don't show status bar while loading
  if (isLoading) {
    return null;
  }

  return (
    <div className="bg-black/20 backdrop-blur-md border-b border-white/10 text-white py-2 px-2 sm:px-4 shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Desktop: Horizontal layout */}
        <div className="hidden md:flex flex-wrap items-center justify-between text-sm">
          {/* Left side - Von Price */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-300">Von Price:</span>
              <span className="font-bold text-yellow-400">
                {formatCurrency(VonPrice, 'USD')}
              </span>
            </div>
          </div>

          {/* Right side - Balances */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-300">USD:</span>
              <span className="font-bold text-green-400">
                {formatCurrency(usdBalance, 'USD')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-300">Von:</span>
              <span className="font-bold text-yellow-400">
                {formatVon(VonBalance)} Von
              </span>
            </div>
            {lockedPlanTokensAmount > 0 && (
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-300">Locked Von:</span>
                <span className="font-bold text-rose-400">
                  {formatVon(lockedPlanTokensAmount)} Von
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Vertical stacked layout with scroll */}
        <div className="md:hidden overflow-x-auto">
          <div className="flex flex-col space-y-2 min-w-max">
            {/* Von Price */}
            <div className="flex items-center justify-between space-x-3 text-xs sm:text-sm">
              <span className="font-semibold text-gray-300 whitespace-nowrap">Von Price:</span>
              <span className="font-bold text-yellow-400 whitespace-nowrap">
                {formatCurrency(VonPrice, 'USD')}
              </span>
            </div>

            {/* Balances - Horizontal scroll on very small screens */}
            <div className="flex items-center space-x-4 overflow-x-auto pb-1">
              <div className="flex items-center space-x-2 text-xs sm:text-sm whitespace-nowrap">
                <span className="font-semibold text-gray-300">USD:</span>
                <span className="font-bold text-green-400">
                  {formatCurrency(usdBalance, 'USD')}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm whitespace-nowrap">
                <span className="font-semibold text-gray-300">Von:</span>
                <span className="font-bold text-yellow-400">
                  {formatVon(VonBalance)} Von
                </span>
              </div>
              {lockedPlanTokensAmount > 0 && (
                <div className="flex items-center space-x-2 text-xs sm:text-sm whitespace-nowrap">
                  <span className="font-semibold text-gray-300">Locked Von:</span>
                  <span className="font-bold text-rose-400">
                    {formatVon(lockedPlanTokensAmount)} Von
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VonStatusBar;













