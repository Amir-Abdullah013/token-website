'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MobileNavigation = ({ user }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Determine if we're on an admin page
  const isAdminPage = pathname.startsWith('/admin');
  
  const userNavigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: '📊' },
    { name: 'Trading', href: '/user/trade', icon: '📈' },
    { name: 'Deposit', href: '/user/deposit', icon: '💰' },
    { name: 'Withdraw', href: '/user/withdraw', icon: '💸' },
    { name: 'Send', href: '/user/send', icon: '📤' },
    { name: 'Staking', href: '/user/staking', icon: '🏦' },
    { name: 'Profile', href: '/user/profile', icon: '👤' },
  ];
  
  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Token Supply', href: '/admin/token-supply', icon: '🪙' },
    { name: 'Deposits', href: '/admin/deposits', icon: '💰' },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: '💸' },
    { name: 'Transfers', href: '/admin/transfers', icon: '📤' },
    { name: 'Stakings', href: '/admin/stakings', icon: '🏦' },
    { name: 'Transactions', href: '/admin/transactions', icon: '📋' },
    { name: 'Reserve History', href: '/admin/reserve-history', icon: '📋' },
  ];
  
  const navigation = isAdminPage ? adminNavigation : userNavigation;
  
  const isActive = (href) => pathname === href;
  
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-md border-t border-slate-600/30 z-50 shadow-2xl">
      {/* Premium Mode indicator */}
      <div className={`px-4 py-1 text-xs font-medium text-center ${
        isAdminPage 
          ? 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-400 border-b border-rose-500/30' 
          : 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border-b border-emerald-500/30'
      }`}>
        {isAdminPage ? '⚙️ Admin Mode' : '👤 User Mode'}
      </div>
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex flex-col items-center justify-center space-y-1 px-1 py-2 transition-all duration-200
              ${isActive(item.href)
                ? 'text-white bg-gradient-to-t from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border-t-2 border-cyan-400 shadow-lg shadow-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-gradient-to-t hover:from-slate-700/20 hover:to-slate-600/20'
              }
            `}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs font-medium leading-tight">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNavigation;
