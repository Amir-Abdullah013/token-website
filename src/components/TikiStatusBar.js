'use client';

import { useTiki } from '@/lib/tiki-context';

const TikiStatusBar = () => {
  const { usdBalance, tikiBalance, tikiPrice, formatCurrency, formatTiki, isLoading } = useTiki();

  // Don't show status bar while loading
  if (isLoading) {
    return null;
  }

  return (
    <div className="bg-black/20 backdrop-blur-md border-b border-white/10 text-white py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between text-sm">
          {/* Left side - Tiki Price */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-300">Tiki Price:</span>
              <span className="font-bold text-yellow-400">
                {formatCurrency(tikiPrice, 'USD')}
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
              <span className="font-semibold text-gray-300">Tiki:</span>
              <span className="font-bold text-yellow-400">
                {formatTiki(tikiBalance)} TIKI
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikiStatusBar;













