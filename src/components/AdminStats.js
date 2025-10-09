'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent } from './Card';

const AdminStats = ({ className = '' }) => {
  const [stats, setStats] = useState([
    {
      title: 'Total Users',
      value: '0',
      change: '+0%',
      changeType: 'positive',
      icon: '👥',
      description: 'vs last month',
      color: 'bg-blue-500'
    },
    {
      title: 'Active Wallets',
      value: '0',
      change: '+0%',
      changeType: 'positive',
      icon: '💼',
      description: 'active accounts',
      color: 'bg-green-500'
    },
    {
      title: 'Total Deposits',
      value: '$0',
      change: '+0%',
      changeType: 'positive',
      icon: '💰',
      description: 'this month',
      color: 'bg-emerald-500'
    },
    {
      title: 'Total Withdrawals',
      value: '$0',
      change: '+0%',
      changeType: 'positive',
      icon: '💸',
      description: 'this month',
      color: 'bg-red-500'
    },
    {
      title: 'Pending Transactions',
      value: '0',
      change: '0',
      changeType: 'neutral',
      icon: '⏳',
      description: 'awaiting approval',
      color: 'bg-yellow-500'
    },
    {
      title: 'System Health',
      value: '100%',
      change: '+0%',
      changeType: 'positive',
      icon: '⚡',
      description: 'uptime',
      color: 'bg-purple-500'
    }
  ]);

  // Fetch admin stats
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats([
            {
              title: 'Total Users',
              value: data.totalUsers?.toString() || '0',
              change: '+0%',
              changeType: 'positive',
              icon: '👥',
              description: 'vs last month',
              color: 'bg-blue-500'
            },
            {
              title: 'Active Wallets',
              value: data.activeWallets?.toString() || '0',
              change: '+0%',
              changeType: 'positive',
              icon: '💼',
              description: 'active accounts',
              color: 'bg-green-500'
            },
            {
              title: 'Total Deposits',
              value: `$${(data.totalDeposits || 0).toLocaleString()}`,
              change: '+0%',
              changeType: 'positive',
              icon: '💰',
              description: 'this month',
              color: 'bg-emerald-500'
            },
            {
              title: 'Total Withdrawals',
              value: `$${(data.totalWithdrawals || 0).toLocaleString()}`,
              change: '+0%',
              changeType: 'positive',
              icon: '💸',
              description: 'this month',
              color: 'bg-red-500'
            },
            {
              title: 'Pending Transactions',
              value: data.pendingTransactions?.toString() || '0',
              change: '0',
              changeType: 'neutral',
              icon: '⏳',
              description: 'awaiting approval',
              color: 'bg-yellow-500'
            },
            {
              title: 'System Health',
              value: '100%',
              change: '+0%',
              changeType: 'positive',
              icon: '⚡',
              description: 'uptime',
              color: 'bg-purple-500'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };

    fetchAdminStats();
  }, []);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index} variant="outlined" className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xl">{stat.icon}</span>
              </div>
              <div className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">
                {stat.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStats;











