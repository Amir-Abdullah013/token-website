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
    { name: 'Deposit', href: '/user/deposit', icon: '💰' },
    { name: 'Withdraw', href: '/user/withdraw', icon: '💸' },
    { name: 'Send', href: '/user/send', icon: '📤' },
    { name: 'Staking', href: '/user/staking', icon: '🏦' },
    { name: 'Trade', href: '/user/trade', icon: '🔄' },
    { name: 'Profile', href: '/user/profile', icon: '👤' },
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
  
  const navigation = isAdminPage ? adminNavigation : userNavigation;
  
  const isActive = (href) => pathname === href;
  
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      {/* Mode indicator */}
      <div className={`px-4 py-1 text-xs font-medium text-center ${
        isAdminPage 
          ? 'bg-red-50 text-red-700' 
          : 'bg-blue-50 text-blue-700'
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
                ? 'text-blue-600 bg-blue-50 border-t-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
