'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';

export default function FeaturesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = () => {
    router.push('/auth/signup');
  };

  const handleLearnMore = () => {
    router.push('/auth/signup');
  };

  const handleStartTrading = () => {
    router.push('/auth/signup');
  };

  const handleViewDocs = () => {
    // You can replace this with actual documentation URL
    window.open('https://docs.example.com', '_blank');
  };

  const handleFeatureLearnMore = (featureName) => {
    // Navigate to specific feature pages or show more details
    switch(featureName) {
      case 'Von Token Trading':
        router.push('/user/trade');
        break;
      case 'Staking Rewards':
        router.push('/user/staking');
        break;
      case 'Portfolio Management':
        router.push('/user/dashboard');
        break;
      case 'Multi-Network Support':
        router.push('/user/deposit');
        break;
      case 'Secure Wallet':
        router.push('/user/profile');
        break;
      case 'Transaction Management':
        router.push('/user/transactions');
        break;
      case 'Premium Dashboard':
        router.push('/user/dashboard');
        break;
      case 'Referral Program':
        router.push('/user/referrals');
        break;
      case 'Notification System':
        router.push('/user/notifications');
        break;
      default:
        router.push('/user/dashboard');
    }
  };

  const features = [
    {
      category: 'Trading & Investment',
      icon: '📈',
      color: 'from-emerald-500 to-green-500',
      bgColor: 'from-emerald-500/20 to-green-500/20',
      borderColor: 'border-emerald-400/30',
      items: [
        {
          title: 'Von Token Trading',
          description: 'Buy and sell Von tokens with real-time market data and advanced trading tools.',
          icon: '🪙',
          features: ['Real-time price tracking', 'Advanced charting', 'Market analysis', 'Trading history']
        },
        {
          title: 'Staking Rewards',
          description: 'Earn passive income by staking your Von tokens with flexible duration options.',
          icon: '🏦',
          features: ['15 days to 1 year plans', 'Up to 75% annual returns', 'Simple interest rewards', 'Flexible unstaking']
        },
        {
          title: 'Portfolio Management',
          description: 'Track your investments and portfolio performance with detailed analytics.',
          icon: '📊',
          features: ['Portfolio overview', 'Performance tracking', 'Asset allocation', 'Profit/loss analysis']
        }
      ]
    },
    {
      category: 'Wallet & Security',
      icon: '🔐',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'from-cyan-500/20 to-blue-500/20',
      borderColor: 'border-cyan-400/30',
      items: [
        {
          title: 'Multi-Network Support',
          description: 'Support for BEP20 and TRC20 networks with seamless cross-chain operations.',
          icon: '🌐',
          features: ['BEP20 (BSC) support', 'TRC20 (TRON) support', 'Cross-chain transfers', 'Network switching']
        },
        {
          title: 'Secure Wallet',
          description: 'Bank-level security with encrypted storage and multi-layer protection.',
          icon: '🛡️',
          features: ['End-to-end encryption', 'Secure key management', 'Multi-signature support', 'Cold storage options']
        },
        {
          title: 'Transaction Management',
          description: 'Complete transaction history with detailed tracking and status updates.',
          icon: '📋',
          features: ['Transaction history', 'Status tracking', 'Fee transparency', 'Export capabilities']
        }
      ]
    },
    {
      category: 'User Experience',
      icon: '✨',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-400/30',
      items: [
        {
          title: 'Premium Dashboard',
          description: 'Beautiful, responsive dashboard with real-time data and intuitive navigation.',
          icon: '🎨',
          features: ['Real-time updates', 'Customizable widgets', 'Dark/light themes', 'Mobile responsive']
        },
        {
          title: 'Referral Program',
          description: 'Earn rewards by referring friends and building your network.',
          icon: '👥',
          features: ['Referral tracking', 'Commission rewards', 'Network building', 'Leaderboards']
        },
        {
          title: 'Notification System',
          description: 'Stay updated with real-time notifications for all important activities.',
          icon: '🔔',
          features: ['Real-time alerts', 'Email notifications', 'Push notifications', 'Custom preferences']
        }
      ]
    },
    {
      category: 'Admin & Management',
      icon: '⚙️',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-400/30',
      items: [
        {
          title: 'Admin Dashboard',
          description: 'Comprehensive admin panel for managing users, transactions, and system settings.',
          icon: '👨‍💼',
          features: ['User management', 'Transaction monitoring', 'System analytics', 'Settings control']
        },
        {
          title: 'Token Management',
          description: 'Advanced token supply management with minting and distribution controls.',
          icon: '🪙',
          features: ['Token minting', 'Supply management', 'Distribution tracking', 'Burn mechanisms']
        },
        {
          title: 'Analytics & Reports',
          description: 'Detailed analytics and reporting for business insights and decision making.',
          icon: '📈',
          features: ['User analytics', 'Transaction reports', 'Revenue tracking', 'Performance metrics']
        }
      ]
    }
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+', icon: '👥' },
    { label: 'Total Transactions', value: '$2.5M+', icon: '💰' },
    { label: 'Staking Rewards', value: '15% APY', icon: '📈' },
    { label: 'Network Support', value: '2 Networks', icon: '🌐' }
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
              🚀 Platform Features
            </h1>
            <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Discover the powerful features that make our platform the ultimate choice for Von token trading and management
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30 px-8 py-3 text-lg transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Button>
              <Button 
                onClick={handleLearnMore}
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-slate-400/30 px-8 py-3 text-lg transition-all duration-300 hover:scale-105"
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="text-center p-6 bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 rounded-xl border border-slate-600/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-slate-300">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {features.map((category, categoryIndex) => (
          <motion.div
            key={categoryIndex}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: categoryIndex * 0.2 }}
            className="mb-20"
          >
            {/* Category Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-full border border-slate-600/30 mb-4">
                <span className="text-2xl">{category.icon}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
                {category.category}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full"></div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={itemIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.2 + itemIndex * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group"
                >
                  <Card className="h-full bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:border-cyan-400/50">
                    <CardHeader>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${category.bgColor} rounded-lg border ${category.borderColor} flex items-center justify-center`}>
                          <span className="text-2xl">{item.icon}</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                            {item.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 mb-6 leading-relaxed">
                        {item.description}
                      </p>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-200 mb-3">Key Features:</h4>
                        {item.features.map((feature, featureIndex) => (
                          <motion.div
                            key={featureIndex}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: categoryIndex * 0.2 + itemIndex * 0.1 + featureIndex * 0.05 }}
                            className="flex items-center space-x-3"
                          >
                            <div className={`w-2 h-2 bg-gradient-to-r ${category.color} rounded-full flex-shrink-0`}></div>
                            <span className="text-sm text-slate-300">{feature}</span>
                          </motion.div>
                        ))}
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-600/30">
                       
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-2xl">
            <CardContent className="py-16">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already benefiting from our comprehensive platform features
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleStartTrading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30 px-8 py-3 text-lg transition-all duration-300 hover:scale-105"
                >
                  Start Trading Now
                </Button>
                <Button 
                  onClick={handleViewDocs}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 border border-purple-400/30 px-8 py-3 text-lg transition-all duration-300 hover:scale-105"
                >
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
