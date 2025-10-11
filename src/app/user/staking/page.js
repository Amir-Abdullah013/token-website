'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../lib/auth-context';

// Self-contained components to avoid import issues
const Button = ({ children, className = '', onClick, disabled = false, type = 'button', variant = 'primary' }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm hover:shadow-md',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 shadow-sm hover:shadow-md',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md'
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, type = 'text', disabled = false, className = '', ...props }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${className}`}
    {...props}
  />
);

const Card = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-white border-gray-200 shadow-sm',
    elevated: 'bg-white border-gray-200 shadow-lg',
    outlined: 'bg-white border-2 border-gray-200'
  };

  return (
    <div className={`rounded-lg border transition-all duration-200 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);


const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CLAIMED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

const LoadingSkeleton = () => (
  <>
    {[...Array(3)].map((_, i) => (
    <tr key={i} className="border-b border-gray-200 animate-pulse">
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
      <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
      <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-20"></div></td>
    </tr>
  ))}
  </>
);

const StakingRow = ({ staking, onClaim }) => {
  const formatTiki = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining(staking.endDate);
  const rewardAmount = (staking.amountStaked * staking.rewardPercent) / 100;
  const totalReturn = staking.amountStaked + rewardAmount;

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatTiki(staking.amountStaked)} TIKI
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {staking.durationDays} days
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {staking.rewardPercent}%
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(staking.startDate)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(staking.endDate)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={staking.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {staking.status === 'ACTIVE' && daysRemaining > 0 ? (
          <span className="text-blue-600 font-medium">
            {daysRemaining} days left
          </span>
        ) : staking.status === 'COMPLETED' ? (
          <span className="text-green-600 font-medium">
            Ready to claim
          </span>
        ) : staking.status === 'CLAIMED' ? (
          <span className="text-gray-600">
            Claimed
          </span>
        ) : (
          <span className="text-gray-500">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {staking.status === 'COMPLETED' ? (
          <Button
            onClick={() => onClaim(staking.id)}
            variant="success"
            className="px-3 py-1 text-xs"
          >
            Claim Reward
          </Button>
        ) : staking.status === 'CLAIMED' ? (
          <span className="text-gray-500 text-xs">Claimed</span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
    </tr>
  );
};

// Simple toast system
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const success = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type: 'success' }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const error = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type: 'error' }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return { success, error, toasts, removeToast };
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`px-4 py-2 rounded-lg shadow-lg cursor-pointer transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
        onClick={() => removeToast(toast.id)}
      >
        {toast.message}
      </div>
    ))}
  </div>
);

export default function StakingPage() {
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const { user, loading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [stakings, setStakings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [tikiBalance, setTikiBalance] = useState(0);

  // Staking form state
  const [stakingAmount, setStakingAmount] = useState('');
  const [stakingDuration, setStakingDuration] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && isAuthenticated && user) {
      // Only fetch data if user is authenticated
      console.log('User authenticated, fetching data for:', user.email);
      fetchStakings();
      fetchUserBalance();
    } else if (mounted && !loading && !isAuthenticated) {
      // Redirect to signin if not authenticated
      console.log('User not authenticated, redirecting to signin');
      router.push('/auth/signin');
    }
  }, [mounted, loading, isAuthenticated, user, router]);

  const fetchUserBalance = async () => {
    try {
      console.log('🔍 Fetching balance for authenticated user:', user?.email);
      const response = await fetch('/api/user/wallet');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.wallet) {
          console.log('✅ User balance fetched:', data.wallet.tikiBalance);
          setTikiBalance(data.wallet.tikiBalance || 0);
        } else {
          console.error('❌ Failed to fetch wallet data:', data.error);
          setTikiBalance(0);
        }
      } else {
        console.error('❌ Failed to fetch balance:', response.status);
        setTikiBalance(0);
      }
    } catch (err) {
      console.error('❌ Error fetching balance:', err);
      setTikiBalance(0);
    }
  };

  const fetchStakings = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      console.log('🔍 Fetching stakings for authenticated user:', user?.email);
      const response = await fetch('/api/stake');
      if (!response.ok) {
        throw new Error(`Failed to fetch stakings: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        console.log('✅ User stakings fetched:', data.stakings?.length || 0);
        if (data.stakings && data.stakings.length > 0) {
          console.log('📋 Sample staking:', {
            id: data.stakings[0].id,
            userId: data.stakings[0].userId,
            amountStaked: data.stakings[0].amountStaked,
            user_name: data.stakings[0].user_name,
            user_email: data.stakings[0].user_email
          });
        }
        setStakings(data.stakings || []);
        // Show warning if there was a database issue
        if (data.warning) {
          console.warn('⚠️ Database warning:', data.warning);
        }
      } else {
        throw new Error(data.error || 'Failed to load stakings');
      }
    } catch (err) {
      console.error('❌ Error fetching stakings:', err);
      // Don't show error state for connection issues, just show empty array
      if (err.message.includes('500') || err.message.includes('timeout')) {
        setStakings([]);
        console.log('🔄 Connection issue - showing empty stakings');
      } else {
        setErrorState(err.message || 'Failed to load stakings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async (e) => {
    e.preventDefault();
    
    if (!stakingAmount || parseFloat(stakingAmount) <= 0) {
      error('Please enter a valid staking amount');
      return;
    }

    if (parseFloat(stakingAmount) > tikiBalance) {
      error(`Insufficient balance. Available: ${tikiBalance.toFixed(2)} TIKI`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(stakingAmount),
          durationDays: stakingDuration
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        success(`✅ ${data.message}`);
        setStakingAmount('');
        fetchUserBalance(); // Refresh balance
        fetchStakings(); // Refresh stakings list
      } else {
        error(data.error || 'Failed to create staking');
      }
    } catch (err) {
      console.error('Error creating staking:', err);
      error(err.message || 'Failed to create staking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async (stakingId) => {
    try {
      const response = await fetch(`/api/stake/${stakingId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        success(`✅ ${data.message}`);
        fetchUserBalance(); // Refresh balance
        fetchStakings(); // Refresh stakings list
      } else {
        error(data.error || 'Failed to claim reward');
      }
    } catch (err) {
      console.error('Error claiming reward:', err);
      error(err.message || 'Failed to claim reward');
    }
  };

  const formatTiki = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!mounted || loading) {
    return (
      <Layout showSidebar={true}>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Layout showSidebar={true}>
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to access the staking page.</p>
            <button 
              onClick={() => router.push('/auth/signin')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={true}>
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Staking</h1>
        </div>

        {/* Current Balance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your TIKI Balance</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-bold text-gray-900">{formatTiki(tikiBalance)} TIKI</p>
          </CardContent>
        </Card>

        {/* Staking Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Stake TIKI Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStake} className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Stake (TIKI)
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={stakingAmount}
                  onChange={(e) => setStakingAmount(e.target.value)}
                  placeholder="Enter amount to stake"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Staking Duration
                </label>
                <select
                  id="duration"
                  value={stakingDuration}
                  onChange={(e) => setStakingDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value={7}>7 days (2% reward)</option>
                  <option value={30}>30 days (10% reward)</option>
                  <option value={90}>90 days (25% reward)</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !stakingAmount || parseFloat(stakingAmount) <= 0}
              >
                {isSubmitting ? 'Creating Staking...' : 'Stake Now'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Stakings */}
        <Card>
          <CardHeader>
            <CardTitle>My Stakings</CardTitle>
          </CardHeader>
          <CardContent>
            {errorState ? (
              <div className="text-center py-8">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-600 mb-4">{errorState}</p>
                <Button onClick={fetchStakings} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Left</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <LoadingSkeleton />
                    ) : stakings.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                          No stakings found. Start staking to earn rewards!
                        </td>
                      </tr>
                    ) : (
                      stakings.map((staking) => (
                        <StakingRow key={staking.id} staking={staking} onClaim={handleClaim} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}