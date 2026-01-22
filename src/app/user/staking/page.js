'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useVon } from '@/lib/Von-context';
import Layout from '@/components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card';
import Button from '@/components/Button';
import { useToast, ToastContainer } from '@/components/Toast';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Coins,
  Calendar,
  Shield,
  Zap,
  Star,
  Gift,
  Users,
  Crown
} from 'lucide-react';

// Define 8 plans
const PLANS = [
  { id: 1, amount: 10, name: 'Starter Plan', icon: '🌟', color: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-400/50' },
  { id: 2, amount: 25, name: 'Basic Plan', icon: '💎', color: 'from-purple-500/20 to-pink-500/20', borderColor: 'border-purple-400/50' },
  { id: 3, amount: 50, name: 'Standard Plan', icon: '⭐', color: 'from-emerald-500/20 to-teal-500/20', borderColor: 'border-emerald-400/50' },
  { id: 4, amount: 100, name: 'Premium Plan', icon: '👑', color: 'from-amber-500/20 to-orange-500/20', borderColor: 'border-amber-400/50' },
  { id: 5, amount: 250, name: 'Gold Plan', icon: '🏆', color: 'from-yellow-500/20 to-amber-500/20', borderColor: 'border-yellow-400/50' },
  { id: 6, amount: 500, name: 'Platinum Plan', icon: '💠', color: 'from-indigo-500/20 to-violet-500/20', borderColor: 'border-indigo-400/50' },
  { id: 7, amount: 1000, name: 'Diamond Plan', icon: '💍', color: 'from-cyan-500/20 to-blue-500/20', borderColor: 'border-cyan-400/50' },
  { id: 8, amount: 2500, name: 'Elite Plan', icon: '👸', color: 'from-rose-500/20 to-pink-500/20', borderColor: 'border-rose-400/50' }
];

export default function StakingPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, VonBalance, VonPrice, formatCurrency, formatVon } = useVon();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Data state
  const [plans, setPlans] = useState(PLANS);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planPurchases, setPlanPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lockedTokens, setLockedTokens] = useState(0);
  const [hasReferrer, setHasReferrer] = useState(false);
  const userIdRef = useRef(null);

  // Update ref whenever user.id changes
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user?.id]);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated && user?.id) {
      fetchPlanPurchases();
      fetchLockedTokens();
      // Refresh locked tokens periodically - ref always has latest user.id
      const interval = setInterval(() => {
        if (userIdRef.current) {
          fetchLockedTokens();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.id]);

  // Check if user was referred (has referrerId) - plans are only visible to referred users
  useEffect(() => {
    if (user?.id) {
      // Check if user has referrerId
      const checkReferrer = async () => {
        try {
          const response = await fetch(`/api/user/referrer-status?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setHasReferrer(data.hasReferrer || false);
          } else {
            // Fallback: check user object directly
            setHasReferrer(!!user.referrerId);
          }
        } catch (error) {
          // Fallback: check user object directly
          setHasReferrer(!!user.referrerId);
        }
      };
      checkReferrer();
    }
  }, [user?.id, user?.referrerId]);

  const fetchPlanPurchases = async () => {
    try {
      setIsLoading(true);
      // Fetch user's plan purchases (we'll create this endpoint if needed)
      // For now, we'll fetch from wallet
      const response = await fetch('/api/wallet/overview');
      if (response.ok) {
        const data = await response.json();
        // Plan purchases will be tracked separately, for now just set empty
        setPlanPurchases([]);
      }
    } catch (error) {
      console.error('Error fetching plan purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLockedTokens = async () => {
    // Get current user.id from ref to avoid stale closure issues
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;
    
    try {
      const response = await fetch(`/api/wallet/overview?userId=${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        // Get locked tokens from wallet - handle Decimal type
        if (data.wallet) {
          const locked = data.wallet.lockedPlanTokensAmount;
          // Handle both string (Decimal) and number types
          const lockedValue = typeof locked === 'string' ? parseFloat(locked) : (locked || 0);
          setLockedTokens(lockedValue);
        }
      }
    } catch (error) {
      // Only log error if it's not a connection refused (server might be restarting)
      if (error.message && !error.message.includes('Failed to fetch') && !error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Error fetching locked tokens:', error);
      }
    }
  };

  const handlePlanPurchase = async (plan) => {
    if (isPurchasing) return;

    // Check if user has sufficient balance
    if (usdBalance < plan.amount) {
      error(`Insufficient balance. You need $${plan.amount} but have ${formatCurrency(usdBalance, 'USD')}`);
      return;
    }

    setIsPurchasing(true);
    setSelectedPlan(plan);

    try {
      const response = await fetch('/api/plans/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        success(`Successfully purchased ${plan.name}! ${result.plan.tokensPurchased.toFixed(2)} tokens locked for 6 months.`);
        // Refresh data immediately
        await fetchPlanPurchases();
        await fetchLockedTokens();
        // Trigger wallet refresh in Von context
        if (window.dispatchEvent) {
          window.dispatchEvent(new Event('wallet-updated'));
        }
      } else {
        error(result.error || 'Failed to purchase plan');
      }
    } catch (error) {
      console.error('Plan purchase error:', error);
      error('Failed to purchase plan. Please try again.');
    } finally {
      setIsPurchasing(false);
      setSelectedPlan(null);
    }
  };

  const calculateTokenAmount = (planAmount) => {
    const tokenPurchaseAmount = planAmount * 0.30; // 30% for tokens
    return tokenPurchaseAmount / VonPrice;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm rounded-lg p-8 border border-slate-600/30 shadow-xl">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
              Authentication Required
            </h1>
            <p className="text-slate-300 mb-6">
              Please sign in to access the plan purchase features.
            </p>
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-800/40 via-slate-700/30 to-slate-800/40 backdrop-blur-sm shadow-xl border-b border-slate-600/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Token Purchase Plans
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                Purchase tokens with our flexible plans. 30% buys tokens (locked for 6 months), 30% goes to your referrer, and 40% is a platform fee.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-indigo-500/30 border border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  USD Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(usdBalance, 'USD')}
                </div>
                <p className="text-slate-300 text-sm">
                  Available for plan purchases
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/30 via-teal-500/30 to-cyan-500/30 border border-emerald-400/50 hover:shadow-xl hover:shadow-emerald-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center">
                  <Coins className="h-5 w-5 mr-2" />
                  Locked Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {formatVon(lockedTokens)}
                </div>
                <p className="text-slate-300 text-sm">
                  Unlock in 6 months
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-500/30 via-purple-500/30 to-indigo-500/30 border border-violet-400/50 hover:shadow-xl hover:shadow-violet-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Current Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {formatCurrency(VonPrice, 'USD')}
                </div>
                <p className="text-slate-300 text-sm">
                  Per token
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Plans Grid - Only show if user has referrer */}
          {!hasReferrer && (
            <Card className="mb-8 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/50">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Plans Available for Referred Users</h3>
                <p className="text-slate-300 mb-4">
                  Plan purchases are available only to users who were referred by another user.
                </p>
                <p className="text-slate-400 text-sm">
                  If you have a referral code, please sign up using it to access plan purchases.
                </p>
              </CardContent>
            </Card>
          )}

          {hasReferrer && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const tokensAmount = calculateTokenAmount(plan.amount);
                const tokenPurchaseAmount = plan.amount * 0.30;
                const referrerAmount = plan.amount * 0.30; // Changed from 40% to 30%
                const adminFeeAmount = plan.amount * 0.40; // Changed from 30% to 40%
                const isSelected = selectedPlan?.id === plan.id;
                const canPurchase = usdBalance >= plan.amount;

                return (
                  <Card
                    key={plan.id}
                    className={`bg-gradient-to-br ${plan.color} border-2 ${plan.borderColor} hover:scale-105 transition-all duration-300 hover:shadow-xl backdrop-blur-sm ${
                      !canPurchase ? 'opacity-60' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="text-center">
                        <div className="text-4xl mb-2">{plan.icon}</div>
                        <CardTitle className="text-xl text-white font-bold mb-1">
                          {plan.name}
                        </CardTitle>
                        <div className="text-3xl font-bold text-white mb-2">
                          {formatCurrency(plan.amount, 'USD')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Breakdown */}
                      <div className="bg-slate-800/40 rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-300">
                          <span>Tokens (30%):</span>
                          <span className="text-white font-semibold">{formatVon(tokensAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Referrer (30%):</span>
                          <span className="text-white font-semibold">{formatCurrency(referrerAmount, 'USD')}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Admin Fee (40%):</span>
                          <span className="text-white font-semibold">{formatCurrency(adminFeeAmount, 'USD')}</span>
                        </div>
                      </div>

                      {/* Lock Period */}
                      <div className="flex items-center justify-center text-slate-300 text-sm">
                        <Lock className="h-4 w-4 mr-2" />
                        <span>Locked for 6 months</span>
                      </div>

                      {/* Purchase Button */}
                      <Button
                        onClick={() => handlePlanPurchase(plan)}
                        disabled={isPurchasing || !canPurchase}
                        className={`w-full ${
                          canPurchase
                            ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-cyan-500/40 border border-cyan-400/60'
                            : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isPurchasing && isSelected ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </div>
                        ) : !canPurchase ? (
                          'Insufficient Balance'
                        ) : (
                          'Purchase Plan'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          )}

          {/* Information Section */}
          <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-emerald-500/30 via-green-500/30 to-teal-500/30 p-4 rounded-lg border border-emerald-400/50">
                  <div className="flex items-center mb-3">
                    <Coins className="h-5 w-5 text-emerald-400 mr-2" />
                    <h3 className="text-sm font-medium text-white">30% - Token Purchase</h3>
                  </div>
                  <p className="text-sm text-slate-300">
                    {formatCurrency(30, 'USD')} of every {formatCurrency(100, 'USD')} plan purchase is used to automatically buy tokens at the current market price. These tokens are locked in your account for 6 months and will be automatically unlocked after the lock period.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-yellow-500/30 p-4 rounded-lg border border-amber-400/50">
                  <div className="flex items-center mb-3">
                    <Users className="h-5 w-5 text-amber-400 mr-2" />
                    <h3 className="text-sm font-medium text-white">30% - Referrer Reward</h3>
                  </div>
                  <p className="text-sm text-slate-300">
                    {formatCurrency(30, 'USD')} of every {formatCurrency(100, 'USD')} plan purchase goes directly to the user who referred you. They'll receive a notification and can see this reward in their transactions.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-violet-500/30 to-purple-500/30 p-4 rounded-lg border border-violet-400/50">
                  <div className="flex items-center mb-3">
                    <Crown className="h-5 w-5 text-violet-400 mr-2" />
                    <h3 className="text-sm font-medium text-white">40% - Platform Fee</h3>
                  </div>
                  <p className="text-sm text-slate-300">
                    {formatCurrency(40, 'USD')} of every {formatCurrency(100, 'USD')} plan purchase is a platform fee that goes to the admin account. This helps maintain and improve the platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}
