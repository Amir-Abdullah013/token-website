'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { useVon } from '@/lib/Von-context';

// Time filter options
const TIME_FILTERS = [
  { label: '1M', value: '1min', hours: 1/60 },
  { label: '1H', value: '1h', hours: 1 },
  { label: '1D', value: '1d', hours: 24 },
  { label: '7D', value: '7d', hours: 168 },
  { label: '30D', value: '30d', hours: 720 }
];

// Generate Von price data based on current price
const generateVonData = (timeFilter, currentPrice) => {
  const now = new Date();
  const data = [];
  const points = 50; // Number of data points
  
  let startTime;
  let interval;
  
  switch (timeFilter) {
    case '1min':
      startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      interval = 60 * 1000; // 1 minute intervals
      break;
    case '1h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      interval = 24 * 60 * 1000; // 1 hour intervals
      break;
    case '1d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      interval = 7 * 24 * 60 * 1000; // 1 day intervals
      break;
    case '7d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      interval = 30 * 24 * 60 * 1000; // 7 day intervals
      break;
    case '30d':
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      interval = 90 * 24 * 60 * 60 * 1000; // 30 day intervals
      break;
    default:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = 7 * 24 * 60 * 1000;
  }
  
  // Generate realistic price movement like real token websites
  // Start at current price (0.0035) and create visible fluctuations
  let basePrice = currentPrice; // Start at current price
  
  // Create a trend that starts at current price, fluctuates, and returns to current price
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(startTime.getTime() + (i * interval));
    
    // For the first point, use exact current price
    if (i === 0) {
      basePrice = currentPrice;
    } else if (i === points - 1) {
      // Last point should be current price
      basePrice = currentPrice;
    } else {
      // Create visible price movements with trend
      // Use a combination of trend and random volatility
      const progress = i / (points - 1); // 0 to 1
      
      // Create a wave pattern that starts and ends at current price
      // This creates visible up and down movements
      const wave = Math.sin(progress * Math.PI * 2) * 0.003; // Wave amplitude
      const trend = (progress - 0.5) * 0.002; // Slight trend
      const volatility = 0.002; // 0.2% random volatility
      const randomChange = (Math.random() - 0.5) * volatility;
      
      // Combine wave, trend, and random changes
      basePrice = currentPrice * (1 + wave + trend + randomChange);
      
      // Keep price within reasonable range (2% above/below current price)
      const minPrice = currentPrice * 0.98; // 2% below
      const maxPrice = currentPrice * 1.02; // 2% above
      basePrice = Math.max(minPrice, Math.min(maxPrice, basePrice));
    }
    
    data.push({
      timestamp: timestamp.toISOString(),
      price: parseFloat(basePrice.toFixed(6)), // More precision for Von
      volume: Math.floor(Math.random() * 10000000) + 1000000, // Higher volume for crypto
      time: timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      date: timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    });
  }
  
  // Ensure all prices are valid numbers BEFORE calculating baseline
  data.forEach((point, index) => {
    if (isNaN(point.price) || point.price <= 0) {
      // If invalid, set to a value between currentPrice * 0.98 and currentPrice * 1.02
      const progress = index / (data.length - 1);
      point.price = currentPrice * (0.98 + progress * 0.04);
    }
  });
  
  // Calculate baseline from minimum price in the dataset (excluding first point which will be forced to currentPrice)
  // This shows the change from the lowest point, which is more meaningful
  const pricesForBaseline = data.length > 1 ? data.slice(1, -1).map(d => d.price) : [currentPrice];
  const minPrice = Math.min(...pricesForBaseline, currentPrice);
  const maxPrice = Math.max(...pricesForBaseline, currentPrice);
  
  // Use minimum price as baseline to show gain from lowest point
  // This is more meaningful than using first point since first point is forced to currentPrice
  const baselinePrice = minPrice;
  
  // Calculate price change from baseline (min price) to current price
  // This shows the change over the selected time period
  const priceChange = currentPrice - baselinePrice;
  
  // Ensure the first point is exactly the current price (for visual consistency)
  if (data.length > 0) {
    data[0].price = currentPrice;
    data[0].timestamp = startTime.toISOString();
  }
  
  // Ensure the last point is exactly the current price
  if (data.length > 0) {
    data[data.length - 1].price = currentPrice;
    data[data.length - 1].timestamp = new Date().toISOString();
    data[data.length - 1].time = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    data[data.length - 1].date = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  console.log('📊 VonPriceChart: Data generation complete', {
    dataLength: data.length,
    priceRange: {
      min: Math.min(...data.map(d => d.price)),
      max: Math.max(...data.map(d => d.price))
    },
    currentPrice,
    baselinePrice,
    priceChange
  });
  
  // Return data with price change info (same format as PriceChart)
  return {
    data: data,
    currentPrice: currentPrice,
    priceChange: priceChange,
    baselinePrice: baselinePrice
  };
};

// Premium custom tooltip component for Von with smart price formatting
const VonTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Smart price formatting for tooltip
    const formatPrice = (price) => {
      if (price < 0.01) {
        return `$${price.toFixed(6)}`;
      } else if (price < 1) {
        return `$${price.toFixed(4)}`;
      } else if (price < 100) {
        return `$${price.toFixed(3)}`;
      } else {
        return `$${price.toFixed(2)}`;
      }
    };
    
    return (
      <div className="bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-md p-3 border-2 border-cyan-500/50 rounded-lg shadow-2xl">
        <p className="text-xs text-slate-300 mb-1.5 font-medium">
          {data.date} {data.time}
        </p>
        <p className="text-lg font-bold text-cyan-400">
          {formatPrice(data.price)}
        </p>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Volume: {data.volume.toLocaleString()} Von
        </p>
      </div>
    );
  }
  return null;
};

// Premium loading skeleton component - Mobile Responsive
const LoadingSkeleton = ({ isMobile = false }) => (
  <div className="animate-pulse">
    <div className={`bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-lg border border-slate-600/20 backdrop-blur-sm ${
      isMobile ? 'h-64' : 'h-64 sm:h-80 lg:h-96'
    }`}>
      <div className="h-full bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-lg"></div>
    </div>
  </div>
);

const VonPriceChart = ({ className = '' }) => {
  const { VonPrice, formatCurrency } = useVon();
  const [selectedFilter, setSelectedFilter] = useState('1d');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(VonPrice);
  const [priceChange, setPriceChange] = useState(0);
  const [baselinePrice, setBaselinePrice] = useState(VonPrice);
  const [isMobile, setIsMobile] = useState(false);
  
  // Calculate Y-axis domain based on current price to ensure proper display
  // Make sure domain shows the full range of price fluctuations
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0 || !currentPrice) {
      return [0, 0.01];
    }
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    const padding = range * 0.1 || currentPrice * 0.01; // 10% padding or 1% of current price
    
    // Ensure domain shows visible range around current price
    const domainMin = Math.max(0, Math.min(minPrice - padding, currentPrice * 0.98));
    const domainMax = Math.max(maxPrice + padding, currentPrice * 1.02);
    
    return [domainMin, domainMax];
  }, [chartData, currentPrice]);

  // Simple mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate data only when filter changes (NOT when VonPrice changes)
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API delay
    const timeoutId = setTimeout(() => {
      const result = generateVonData(selectedFilter, VonPrice);
      setChartData(result.data);
      setCurrentPrice(result.currentPrice);
      setPriceChange(result.priceChange); // Use priceChange from generator (same as PriceChart)
      setBaselinePrice(result.baselinePrice || result.currentPrice); // Store baseline for percentage calculation
      
      setIsLoading(false);
    }, 500);

    // Cleanup timeout on unmount or dependency change
    return () => clearTimeout(timeoutId);
  }, [selectedFilter]); // Removed VonPrice dependency

  // Update current price and chart data smoothly without re-rendering
  useEffect(() => {
    if (VonPrice !== currentPrice && VonPrice > 0) {
      setCurrentPrice(VonPrice);
      
      // Update chart data smoothly without triggering re-render
      setChartData(prevData => {
        if (prevData.length > 0) {
          const newData = [...prevData];
          const lastIndex = newData.length - 1;
          
          // Update the last data point with new price
          newData[lastIndex] = {
            ...newData[lastIndex],
            price: VonPrice,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }),
            date: new Date().toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })
          };
          
          // Recalculate price change when VonPrice updates
          // Use the stored baselinePrice to maintain consistency
          if (newData.length > 0) {
            setPriceChange(VonPrice - baselinePrice);
          }
          
          return newData;
        }
        return prevData;
      });
    }
  }, [VonPrice, currentPrice]);


  // Handle filter change - memoized to prevent unnecessary re-renders
  const handleFilterChange = useCallback((filter) => {
    setSelectedFilter(filter);
  }, []);

  // Enhanced chart configuration for better mobile experience
  const chartConfig = useMemo(() => ({
    margin: { 
      top: 10, 
      right: isMobile ? 15 : 20, 
      left: isMobile ? 10 : 10, // Optimized left margin
      bottom: isMobile ? 10 : 10 
    },
    strokeWidth: isMobile ? 2.5 : 3,
    dotRadius: isMobile ? 5 : 6,
    fontSize: isMobile ? 11 : 12, // Slightly larger font for mobile
    yAxisWidth: isMobile ? 70 : 80 // Increased width for better label display
  }), [isMobile]);

  // Memoize price change calculations
  const priceChangeInfo = useMemo(() => {
    // Use stored baselinePrice for consistent percentage calculation (same as PriceChart)
    const percentage = baselinePrice > 0 ? ((priceChange / baselinePrice) * 100).toFixed(2) : '0.00';
    
    return {
      color: priceChange >= 0 ? 'text-green-600' : 'text-red-600',
      icon: priceChange >= 0 ? '📈' : '📉',
      percentage: percentage
    };
  }, [priceChange, baselinePrice]);


  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              VON Price Chart
            </CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-slate-300 font-medium">Time Range:</span>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {TIME_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={selectedFilter === filter.value ? 'default' : 'outline'}
                    onClick={() => handleFilterChange(filter.value)}
                    className={`text-xs px-2 py-1 sm:px-3 sm:py-1.5 transition-all duration-200 ${
                      selectedFilter === filter.value
                        ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30'
                        : 'bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-slate-300 hover:from-slate-500/50 hover:to-slate-600/50 hover:text-white border border-slate-500/30'
                    }`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Premium Current Price Display - Mobile Responsive */}
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-lg p-3 sm:p-4 border border-slate-600/30 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-slate-300 font-medium">Current Von Price</p>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  {currentPrice < 0.01 ? `$${currentPrice.toFixed(6)}` : formatCurrency(currentPrice, 'USD')}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div className={`flex items-center justify-center sm:justify-end text-xs sm:text-sm font-semibold ${priceChangeInfo.color}`}>
                  <span className="mr-1">{priceChangeInfo.icon}</span>
                  <span>
                    {priceChange >= 0 ? '+' : ''}{Math.abs(priceChange) < 0.01 ? `$${priceChange.toFixed(6)}` : formatCurrency(priceChange, 'USD')} 
                    ({priceChangeInfo.percentage}%)
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedFilter === '1min' ? 'Last hour' :
                   selectedFilter === '1h' ? 'Last 24 hours' :
                   selectedFilter === '1d' ? 'Last 7 days' :
                   selectedFilter === '7d' ? 'Last 30 days' :
                   'Last 90 days'}
                </p>
              </div>
            </div>
          </div>

          {/* Premium Chart - Mobile Responsive */}
          {isLoading ? (
            <LoadingSkeleton isMobile={isMobile} />
          ) : chartData.length === 0 ? (
            <div className={`bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-lg p-2 sm:p-4 border border-slate-600/20 ${
              isMobile ? 'h-64' : 'h-64 sm:h-80 lg:h-96'
            } flex items-center justify-center`}>
              <div className="text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                <p>Loading chart data...</p>
              </div>
            </div>
          ) : (
            <div className={`bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-lg p-2 sm:p-4 border border-slate-600/20 ${
              isMobile ? 'h-64' : 'h-64 sm:h-80 lg:h-96'
            }`}>
              <ResponsiveContainer 
                width="100%" 
                height="100%"
                debounce={isMobile ? 50 : 100}
                minHeight={isMobile ? 200 : 300}
              >
                <LineChart 
                  data={chartData} 
                  margin={chartConfig.margin}
                  syncId="von-price-chart"
                  key={`chart-${chartData.length}-${currentPrice}`}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#475569" 
                    opacity={0.3}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="time"
                    stroke="#94A3B8"
                    fontSize={chartConfig.fontSize}
                    tickLine={false}
                    axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                    tick={{ fill: '#94A3B8', fontSize: chartConfig.fontSize }}
                    interval={isMobile ? 'preserveStartEnd' : 'preserveStartEnd'}
                  />
                  <YAxis 
                    stroke="#94A3B8"
                    fontSize={chartConfig.fontSize}
                    tickLine={false}
                    axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                    tick={{ fill: '#94A3B8', fontSize: chartConfig.fontSize }}
                    tickFormatter={(value) => {
                      // Smart formatting based on price magnitude
                      if (value < 0.01) {
                        // For very small prices like $0.0035, show 6 decimal places
                        return `$${value.toFixed(6)}`;
                      } else if (value < 1) {
                        // For prices between $0.01 and $1, show 4 decimal places
                        return `$${value.toFixed(4)}`;
                      } else if (value < 100) {
                        // For prices between $1 and $100, show 2 decimal places
                        return `$${value.toFixed(2)}`;
                      } else {
                        // For larger prices, show 1 decimal place
                        return `$${value.toFixed(1)}`;
                      }
                    }}
                    width={chartConfig.yAxisWidth}
                    domain={yAxisDomain}
                    allowDecimals={true}
                    scale="linear"
                  />
                  <Tooltip content={<VonTooltip />} />
                  <defs>
                    <linearGradient id="VonPriceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3}/>
                      <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="VonPriceLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#3B82F6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#06B6D4"
                    strokeWidth={isMobile ? 2.5 : 3}
                    dot={false}
                    activeDot={{ 
                      r: isMobile ? 5 : 6, 
                      fill: '#06B6D4', 
                      stroke: '#ffffff', 
                      strokeWidth: 2,
                      filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.8))'
                    }}
                    fill="url(#VonPriceGradient)"
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                  <ReferenceLine 
                    y={currentPrice} 
                    stroke="#10B981" 
                    strokeDasharray="5 5"
                    strokeOpacity={0.6}
                    strokeWidth={isMobile ? 1.5 : 2}
                    label={{ value: 'Current', position: 'right', fill: '#10B981', fontSize: 10 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Premium Chart Info - Mobile Responsive */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs text-slate-400 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-lg p-2 sm:p-3 border border-slate-600/20">
            <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-4">
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mr-1 sm:mr-2 shadow-sm shadow-cyan-500/50"></div>
                <span className="text-slate-200 font-medium text-xs sm:text-sm">Von Price</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mr-1 sm:mr-2 shadow-sm shadow-emerald-500/50" style={{ opacity: 0.8 }}></div>
                <span className="text-slate-200 font-medium text-xs sm:text-sm">Current</span>
              </div>
            </div>
            <div className="text-center sm:text-right text-slate-300 font-medium text-xs sm:text-sm">
              {chartData.length} data points
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default VonPriceChart;














