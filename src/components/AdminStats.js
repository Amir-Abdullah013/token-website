'use client';

import Card, { CardContent } from './Card';

const AdminStats = ({ className = '' }) => {
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12.5%',
      changeType: 'positive',
      icon: '👥',
      description: 'vs last month',
      color: 'bg-blue-500'
    },
    {
      title: 'Active Wallets',
      value: '987',
      change: '+8.3%',
      changeType: 'positive',
      icon: '💼',
      description: 'active accounts',
      color: 'bg-green-500'
    },
    {
      title: 'Total Deposits',
      value: '$2.4M',
      change: '+15.2%',
      changeType: 'positive',
      icon: '💰',
      description: 'this month',
      color: 'bg-emerald-500'
    },
    {
      title: 'Total Withdrawals',
      value: '$1.8M',
      change: '+7.1%',
      changeType: 'positive',
      icon: '💸',
      description: 'this month',
      color: 'bg-red-500'
    },
    {
      title: 'Pending Transactions',
      value: '23',
      change: '-5',
      changeType: 'negative',
      icon: '⏳',
      description: 'awaiting approval',
      color: 'bg-yellow-500'
    },
    {
      title: 'System Health',
      value: '99.8%',
      change: '+0.2%',
      changeType: 'positive',
      icon: '⚡',
      description: 'uptime',
      color: 'bg-purple-500'
    }
  ];

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










