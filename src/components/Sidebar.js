'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = ({ user, isOpen, onClose }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine if we're on an admin page
  const isAdminPage = pathname.startsWith('/admin');
  
  const userNavigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: '📊', category: 'main' },
    { name: 'Trading', href: '/user/trade', icon: '📈', category: 'main' },
    { name: 'Deposit', href: '/user/deposit', icon: '💰', category: 'wallet' },
    { name: 'Withdraw', href: '/user/withdraw', icon: '💸', category: 'wallet' },
    { name: 'Send Tokens', href: '/user/send', icon: '📤', category: 'wallet' },
    { name: 'Staking', href: '/user/staking', icon: '🏦', category: 'earn' },
    { name: 'Referrals', href: '/user/referrals', icon: '👥', category: 'earn' },
    { name: 'Transactions', href: '/user/transactions', icon: '📋', category: 'history' },
    { name: 'Profile', href: '/user/profile', icon: '👤', category: 'account' },
  ];
  
  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Wallets', href: '/admin/wallets', icon: '💼' },
    { name: 'Deposits', href: '/admin/deposits', icon: '💰' },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: '💸' },
    { name: 'Transfers', href: '/admin/transfers', icon: '📤' },
    { name: 'Stakings', href: '/admin/stakings', icon: '🏦' },
    { name: 'Transactions', href: '/admin/transactions', icon: '📋' },
  ];
  
  // Use admin navigation if we're on admin pages, otherwise use user navigation
  const navigation = isAdminPage ? adminNavigation : userNavigation;
  
  const isActive = (href) => pathname === href;
  
  if (!mounted) {
    return null;
  }
  
  // Group navigation by category
  const groupedNavigation = navigation.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const categoryLabels = {
    main: 'Main',
    trading: 'Trading',
    wallet: 'Wallet',
    earn: 'Earn',
    history: 'History',
    account: 'Account'
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Premium Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 backdrop-blur-md border-r border-slate-600/30 shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
         
          
          {/* Premium User Info Section */}
          <div className="px-6 py-4 border-b border-slate-600/30 bg-gradient-to-r from-slate-800/40 to-slate-700/40">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-sm font-medium text-white">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isAdminPage 
                      ? 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-400 border border-rose-500/30 shadow-sm' 
                      : 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  }`}>
                    {isAdminPage ? 'Admin' : 'User'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
          </div>
          
          {/* Premium Navigation with Categories */}
          <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
            {Object.entries(groupedNavigation).map(([category, items]) => (
              <div key={category}>
                <h3 className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 bg-gradient-to-r from-slate-600/20 to-slate-700/20 rounded">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-1">
                  {items.map((item) => {
                    // Category-specific color schemes
                    const getCategoryColors = (category) => {
                      switch (category) {
                        case 'main':
                          return {
                            active: 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/30 shadow-lg shadow-cyan-500/10',
                            hover: 'hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10',
                            accent: 'bg-cyan-400'
                          };
                        case 'wallet':
                          return {
                            active: 'bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 border border-emerald-400/30 shadow-lg shadow-emerald-500/10',
                            hover: 'hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10',
                            accent: 'bg-emerald-400'
                          };
                        case 'earn':
                          return {
                            active: 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/30 shadow-lg shadow-amber-500/10',
                            hover: 'hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10',
                            accent: 'bg-amber-400'
                          };
                        case 'history':
                          return {
                            active: 'bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 border border-violet-400/30 shadow-lg shadow-violet-500/10',
                            hover: 'hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-purple-500/10',
                            accent: 'bg-violet-400'
                          };
                        case 'account':
                          return {
                            active: 'bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-purple-500/20 border border-rose-400/30 shadow-lg shadow-rose-500/10',
                            hover: 'hover:bg-gradient-to-r hover:from-rose-500/10 hover:to-pink-500/10',
                            accent: 'bg-rose-400'
                          };
                        default:
                          return {
                            active: 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 border border-slate-400/30 shadow-lg shadow-slate-500/10',
                            hover: 'hover:bg-gradient-to-r hover:from-slate-500/10 hover:to-slate-600/10',
                            accent: 'bg-slate-400'
                          };
                      }
                    };

                    const colors = getCategoryColors(category);

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                          isActive(item.href)
                            ? colors.active
                            : `text-slate-300 ${colors.hover} hover:text-white`
                        }`}
                        onClick={() => {
                          // Close mobile sidebar when navigating
                          if (window.innerWidth < 1024) {
                            onClose();
                          }
                        }}
                      >
                        <span className="mr-3 text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="flex-1">{item.name}</span>
                        {isActive(item.href) && (
                          <div className={`w-1 h-1 ${colors.accent} rounded-full shadow-sm`}></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          
          {/* Premium Admin Quick Switch */}
          {user?.role === 'admin' && (
            <div className="px-6 py-4 border-t border-slate-600/30 bg-gradient-to-r from-slate-800/40 to-slate-700/40">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider bg-gradient-to-r from-slate-600/20 to-slate-700/20 rounded px-2 py-1">Quick Switch</p>
                <div className="flex space-x-2">
                  <Link
                    href="/user/dashboard"
                    className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                      !isAdminPage
                        ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-400/30 shadow-sm'
                        : 'text-slate-400 hover:bg-gradient-to-r hover:from-slate-600/20 hover:to-slate-700/20 hover:text-slate-300'
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    <span className="mr-2">👤</span>
                    User View
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className={`flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                      isAdminPage
                        ? 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-400 border border-rose-400/30 shadow-sm'
                        : 'text-slate-400 hover:bg-gradient-to-r hover:from-slate-600/20 hover:to-slate-700/20 hover:text-slate-300'
                    }`}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    <span className="mr-2">⚙️</span>
                    Admin View
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Footer */}
          
        </div>
      </div>
    </>
  );
};

export default Sidebar;
