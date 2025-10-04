'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import WalletOverview from '../../../components/WalletOverview';
import PriceChart from '../../../components/PriceChart';
import { ToastContainer, useToast } from '../../../components/Toast';

export default function UserDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  const { toasts, removeToast } = useToast();

  // Trading state
  const [tradeType, setTradeType] = useState('buy');
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [tradeAmount, setTradeAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(45230);
  const [availableBalance, setAvailableBalance] = useState(1.5);

  // Calculate total value
  const totalValue = parseFloat(tradeAmount) * currentPrice || 0;

  // Handle trade execution
  const handleTrade = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return;

    setIsTrading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      alert(`${tradeType === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
      
      // Reset form
      setTradeAmount('');
    } catch (error) {
      console.error('Trade error:', error);
      alert('Trade failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  // Update prices periodically
  useEffect(() => {
    const updatePrices = () => {
      const priceVariations = {
        'BTC': 45230 + (Math.random() - 0.5) * 1000,
        'ETH': 3420 + (Math.random() - 0.5) * 100,
        'ADA': 0.45 + (Math.random() - 0.5) * 0.05,
        'DOT': 25.30 + (Math.random() - 0.5) * 2
      };
      setCurrentPrice(priceVariations[selectedAsset]);
    };

    updatePrices();
    const interval = setInterval(updatePrices, 5000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  // ✅ Prevent hydration mismatches by only running client-side code after mount
  useEffect(() => {
    setMounted(true);
    console.log('Dashboard: Component mounted');
    
    // Use requestAnimationFrame to ensure DOM is ready
    const initializeDashboard = () => {
      // Check for OAuth success parameters in URL
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSuccess = urlParams.get('oauth_success');
      const provider = urlParams.get('provider');
      const session = urlParams.get('session');
      const userEmail = urlParams.get('userEmail');
      const userName = urlParams.get('userName');
      const userId = urlParams.get('userId');
      const userPicture = urlParams.get('userPicture');

      if (oauthSuccess === 'true' && provider && userEmail) {
        console.log('Dashboard: OAuth success detected, storing session data');
        
        // Store OAuth session data
        const oauthData = {
          provider,
          session,
          timestamp: Date.now()
        };

        // Store user session data
        const userSessionData = {
          $id: userId,
          id: userId,
          email: userEmail,
          name: userName,
          picture: userPicture,
          provider: provider,
          role: 'USER',
          emailVerified: true
        };

        // Store in localStorage
        localStorage.setItem('oauthSession', JSON.stringify(oauthData));
        localStorage.setItem('userSession', JSON.stringify(userSessionData));

        console.log('Dashboard: OAuth session data stored', userSessionData);
        setIsOAuthCallback(true);

        // Clean up URL parameters
        window.history.replaceState({}, '', '/user/dashboard');
      } else {
        // Check if we have existing OAuth session data in localStorage
        const oauthSession = localStorage.getItem('oauthSession');
        const userSession = localStorage.getItem('userSession');
        
        if (oauthSession && userSession) {
          console.log('Dashboard: Found existing OAuth session data in localStorage');
          setIsOAuthCallback(true);
        }
      }

      // REMOVED: The problematic reload logic that was causing infinite loops
      // The auth context will handle user session loading properly
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initializeDashboard);
  }, []);

  // ✅ Redirect to signin if not authenticated (only after component mounts)
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated && !user) {
      console.log('Dashboard: User not authenticated, redirecting to signin');
      // Add a small delay to prevent race conditions on Vercel
      setTimeout(() => {
        router.push('/auth/signin?redirect=/user/dashboard');
      }, 100);
    }
  }, [mounted, loading, isAuthenticated, user, router]);

  // ✅ Show loading state while checking authentication
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ✅ Show loading state if not authenticated (NO REDIRECT)
  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // ✅ Show dashboard content if authenticated
  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name || user?.email || 'User'}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                 
                 
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Balance</p>
                      <p className="text-2xl font-bold text-gray-900">$12,345.67</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Coins</p>
                      <p className="text-2xl font-bold text-gray-900">1,234.56</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Deposit Amount</p>
                      <p className="text-2xl font-bold text-gray-900">$5,678.90</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Withdraw Amount</p>
                      <p className="text-2xl font-bold text-gray-900">$1,234.56</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Wallet Overview - Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Wallet Overview */}
              <Card className="cursor-pointer">
                <CardHeader>
                  
                </CardHeader>
                <CardContent>
                  <WalletOverview />
                </CardContent>
              </Card>

              {/* Price Chart */}
              <Card className="cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Price Chart</CardTitle>
                   
                  </div>
                </CardHeader>
                <CardContent>
                  <PriceChart />
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Transactions</CardTitle>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'buy', asset: 'BTC', amount: '0.5', price: '$45,230', time: '2 min ago', status: 'completed' },
                      { type: 'sell', asset: 'ETH', amount: '2.1', price: '$3,420', time: '1 hour ago', status: 'completed' },
                      { type: 'buy', asset: 'ADA', amount: '1000', price: '$0.45', time: '3 hours ago', status: 'pending' },
                      { type: 'sell', asset: 'DOT', amount: '50', price: '$25.30', time: '1 day ago', status: 'completed' },
                    ].map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <span className={`text-sm font-bold ${
                              transaction.type === 'buy' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'buy' ? '+' : '-'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.asset}</p>
                            <p className="text-sm text-gray-500">{transaction.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{transaction.amount} {transaction.asset}</p>
                          <p className="text-sm text-gray-500">{transaction.price}</p>
                        </div>
                        <div className="ml-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
                     {/* Buy/Sell Panel */}
                     <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                       <CardHeader className="p-4 sm:p-6">
                         <div className="flex items-center justify-between">
                           <CardTitle className="text-lg sm:text-xl">Quick Trade</CardTitle>
                           <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                             <span className="mr-2">⚡</span>
                             Live Prices
                           </Button>
                         </div>
                       </CardHeader>
                       <CardContent className="p-4 sm:p-6">
                         <div className="space-y-4 sm:space-y-6">
                           {/* Buy/Sell Toggle */}
                           <div className="flex bg-gray-100 rounded-lg p-1">
                             <button 
                               className={`flex-1 py-2 cursor-pointer px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                                 tradeType === 'buy' 
                                   ? 'bg-white text-gray-900 shadow-sm cursor-pointer' 
                                   : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                               }`}
                               onClick={() => setTradeType('buy')}
                             >
                               Buy
                             </button>
                             <button 
                               className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                                 tradeType === 'sell' 
                                   ? 'bg-white text-gray-900 shadow-sm cursor-pointer' 
                                   : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                               }`}
                               onClick={() => setTradeType('sell')}
                             >
                               Sell
                             </button>
                           </div>

                           {/* Asset Selection */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Asset</label>
                             <select 
                               value={selectedAsset}
                               onChange={(e) => setSelectedAsset(e.target.value)}
                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             >
                               <option value="BTC">Bitcoin (BTC)</option>
                               <option value="ETH">Ethereum (ETH)</option>
                               <option value="ADA">Cardano (ADA)</option>
                               <option value="DOT">Polkadot (DOT)</option>
                             </select>
                           </div>

                           {/* Amount Input */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                             <input
                               type="number"
                               placeholder="0.00"
                               value={tradeAmount}
                               onChange={(e) => setTradeAmount(e.target.value)}
                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             />
                           </div>

                           {/* Price Display */}
                           <div className="p-4 bg-gray-50 rounded-lg">
                             <div className="flex justify-between text-sm mb-2">
                               <span className="text-gray-500">Current Price:</span>
                               <span className="font-medium">${currentPrice.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-sm mb-2">
                               <span className="text-gray-500">Amount:</span>
                               <span className="font-medium">{tradeAmount || '0'} {selectedAsset}</span>
                             </div>
                             <div className="flex justify-between text-sm font-semibold">
                               <span className="text-gray-700">Total:</span>
                               <span className={`${tradeType === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                                 ${totalValue.toLocaleString()}
                               </span>
                             </div>
                           </div>

                           {/* Balance Check */}
                           {tradeType === 'sell' && parseFloat(tradeAmount) > 0 && (
                             <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                               <div className="flex items-center">
                                 <span className="text-yellow-600 mr-2">⚠️</span>
                                 <span className="text-sm text-yellow-800">
                                   Available: {availableBalance} {selectedAsset}
                                 </span>
                               </div>
                             </div>
                           )}

                           {/* Trade Button */}
                           <Button 
                             className={`w-full ${
                               tradeType === 'buy' 
                                 ? 'bg-green-600 hover:bg-green-700' 
                                 : 'bg-red-600 hover:bg-red-700'
                             }`}
                             onClick={handleTrade}
                             disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || isTrading}
                           >
                             {isTrading ? (
                               <div className="flex items-center">
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                 Processing...
                               </div>
                             ) : (
                               `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedAsset}`
                             )}
                           </Button>

                           {/* Quick Amount Buttons */}
                           <div className="grid grid-cols-3 gap-2">
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setTradeAmount('0.1')}
                               className="text-xs"
                             >
                               0.1
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setTradeAmount('0.5')}
                               className="text-xs"
                             >
                               0.5
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setTradeAmount('1.0')}
                               className="text-xs"
                             >
                               1.0
                             </Button>
                           </div>
                         </div>
                       </CardContent>
                     </Card>

              {/* Market Overview */}
              <Card className="cursor-pointer">
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Bitcoin', symbol: 'BTC', price: '$45,230', change: '+2.34%', changeType: 'positive' },
                      { name: 'Ethereum', symbol: 'ETH', price: '$3,420', change: '-1.23%', changeType: 'negative' },
                      { name: 'Cardano', symbol: 'ADA', price: '$0.45', change: '+5.67%', changeType: 'positive' },
                      { name: 'Polkadot', symbol: 'DOT', price: '$25.30', change: '+0.89%', changeType: 'positive' },
                    ].map((asset, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{asset.symbol[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{asset.name}</p>
                            <p className="text-sm text-gray-500">{asset.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{asset.price}</p>
                          <p className={`text-sm ${
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

          {/* Additional Sections */}
          <div className="mt-12 space-y-8">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              
            </div>

            

            {/* Quick Stats */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Quick Stats</CardTitle>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <span className="mr-2">📈</span>
                    View Analytics
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">156</div>
                    <div className="text-sm text-gray-600">Total Trades</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">$45.2K</div>
                    <div className="text-sm text-gray-600">Total Profit</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">8</div>
                    <div className="text-sm text-gray-600">Active Orders</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">92%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}
