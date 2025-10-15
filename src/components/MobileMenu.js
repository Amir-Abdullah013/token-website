'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import WalletOverview from './WalletOverview';
import PriceChart from './PriceChart';

const MobileMenu = ({ user, isOpen, onClose }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const navigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: '📊' },
    { name: 'Trading', href: '/user/trade', icon: '📈' },
    { name: 'Deposit', href: '/user/deposit', icon: '💰' },
    { name: 'Withdraw', href: '/user/withdraw', icon: '💸' },
    { name: 'Send Tokens', href: '/user/send', icon: '📤' },
    { name: 'Staking', href: '/user/staking', icon: '🏦' },
    { name: 'Referrals', href: '/user/referrals', icon: '👥' },
    { name: 'Transactions', href: '/user/transactions', icon: '📋' },
    { name: 'Features', href: '/features', icon: '🚀' },
    { name: 'Profile', href: '/user/profile', icon: '👤' },
    { name: 'Security', href: '/user/security', icon: '🔒' },
    { name: 'Support', href: '/user/support', icon: '💬' },
  ];
  
  const isActive = (href) => pathname === href;
  
  if (!mounted) {
    return null;
  }
  
  return (
    <>
      {/* Premium Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Premium Mobile Menu */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-slate-600/30
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Premium Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-600/30 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Premium User info */}
          <div className="px-6 py-4 border-b border-slate-600/30 bg-gradient-to-r from-slate-800/40 to-slate-700/40">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-lg font-medium text-white">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
          </div>
          
          {/* Premium Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-l-4 border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/20 hover:to-slate-600/20 hover:text-white'
                  }
                `}
                onClick={onClose}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
          
          {/* Premium Additional Components */}
          <div className="px-6 py-4 border-t border-slate-600/30 bg-gradient-to-r from-slate-800/40 to-slate-700/40">
            <div className="space-y-4">
              {/* Premium Quick Stats */}
              <Card className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-600/30">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm text-white bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-400/30">
                      <div className="text-lg font-bold text-cyan-400">156</div>
                      <div className="text-xs text-slate-300">Total Trades</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg border border-emerald-400/30">
                      <div className="text-lg font-bold text-emerald-400">$45.2K</div>
                      <div className="text-xs text-slate-300">Total Profit</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Market Overview */}
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Market Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {[
                      { name: 'Bitcoin', symbol: 'BTC', price: '$45,230', change: '+2.34%', changeType: 'positive' },
                      { name: 'Ethereum', symbol: 'ETH', price: '$3,420', change: '-1.23%', changeType: 'negative' },
                    ].map((asset, index) => (
                      <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{asset.symbol[0]}</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{asset.name}</p>
                            <p className="text-xs text-gray-500">{asset.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-900">{asset.price}</p>
                          <p className={`text-xs ${
                            asset.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {asset.change}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;














