'use client';

import Card, { CardContent } from './Card';

const QuickStats = ({ 
  className = '', 
  portfolioValue = 0,
  totalDeposits = 0,
  totalWithdrawals = 0,
  activeTrades = 0,
  formatCurrency = (amount) => `$${amount.toFixed(2)}`
}) => {
  const stats = [
    {
      title: 'Portfolio Value',
      value: formatCurrency(portfolioValue),
      change: '+5.2%',
      changeType: 'positive',
      icon: '📈',
      description: 'vs last month'
    },
    {
      title: 'Total Deposits',
      value: formatCurrency(totalDeposits),
      change: '+12.3%',
      changeType: 'positive',
      icon: '💰',
      description: 'this month'
    },
    {
      title: 'Total Withdrawals',
      value: formatCurrency(totalWithdrawals),
      change: '-3.1%',
      changeType: 'negative',
      icon: '💸',
      description: 'this month'
    },
    {
      title: 'Active Trades',
      value: activeTrades.toString(),
      change: '+2',
      changeType: 'positive',
      icon: '🔄',
      description: 'open positions'
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index} variant="outlined" className="hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl">{stat.icon}</span>
              </div>
              <div className={`text-xs sm:text-sm md:text-base lg:text-lg font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
            
            <div>
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-gray-600 mb-1 sm:mb-2">
                {stat.title}
              </h3>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm md:text-base text-gray-500">
                {stat.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickStats;


