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
  let basePrice = currentPrice * 0.95; // Start slightly below current price
  
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(startTime.getTime() + (i * interval));
    
    // Small realistic price movements
    const volatility = 0.002; // 0.2% volatility for stable token
    const change = (Math.random() - 0.5) * volatility;
    basePrice = basePrice * (1 + change);
    
    // Keep price close to current price
    const minPrice = currentPrice * 0.98;
    const maxPrice = currentPrice * 1.02;
    basePrice = Math.max(minPrice, Math.min(maxPrice, basePrice));
    
    data.push({
      timestamp: timestamp.toISOString(),
      price: parseFloat(basePrice.toFixed(4)), // More precision for Von
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
  
  // Ensure all prices are valid numbers
  data.forEach((point, index) => {
    if (isNaN(point.price) || point.price <= 0) {
      point.price = currentPrice * (0.9 + (index / data.length) * 0.2); // Gradual increase
    }
  });
  
  console.log('📊 VonPriceChart: Data generation complete', {
    dataLength: data.length,
    priceRange: {
      min: Math.min(...data.map(d => d.price)),
      max: Math.max(...data.map(d => d.price))
    },
    currentPrice
  });
  
  return data;
};

// Premium custom tooltip component for Von
const VonTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md p-4 border border-slate-600/30 rounded-lg shadow-2xl">
        <p className="text-sm text-slate-300 mb-2 font-medium">
          {data.date} {data.time}
        </p>
        <p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          ${data.price.toFixed(4)}
        </p>
        <p className="text-xs text-slate-400 font-medium">
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
  const [isMobile, setIsMobile] = useState(false);

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
      const data = generateVonData(selectedFilter, VonPrice);
      setChartData(data);
      
      if (data.length > 0) {
        const latest = data[data.length - 1];
        const previous = data[data.length - 2];
        setCurrentPrice(latest.price);
        setPriceChange(latest.price - previous.price);
      }
      
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
          
          // Calculate price change from previous point
          if (newData.length > 1) {
            const previousPrice = newData[lastIndex - 1].price;
            setPriceChange(VonPrice - previousPrice);
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

  // Simple chart configuration
  const chartConfig = useMemo(() => ({
    margin: { 
      top: 5, 
      right: isMobile ? 10 : 30, 
      left: isMobile ? 10 : 20, 
      bottom: isMobile ? 5 : 10 
    },
    strokeWidth: isMobile ? 2 : 3,
    dotRadius: isMobile ? 4 : 6,
    fontSize: isMobile ? 10 : 12,
    yAxisWidth: isMobile ? 40 : 60
  }), [isMobile]);

  // Memoize price change calculations
  const priceChangeInfo = useMemo(() => ({
    color: priceChange >= 0 ? 'text-green-600' : 'text-red-600',
    icon: priceChange >= 0 ? '📈' : '📉',
    percentage: currentPrice > 0 ? ((priceChange / (currentPrice - priceChange)) * 100).toFixed(2) : '0.00'
  }), [priceChange, currentPrice]);


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
                  {formatCurrency(currentPrice, 'USD')}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div className={`flex items-center justify-center sm:justify-end text-xs sm:text-sm font-semibold ${priceChangeInfo.color}`}>
                  <span className="mr-1">{priceChangeInfo.icon}</span>
                  <span>
                    {priceChange >= 0 ? '+' : ''}{formatCurrency(priceChange, 'USD')} 
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748B" opacity={0.2} />
                  <XAxis 
                    dataKey="time"
                    stroke="#94A3B8"
                    fontSize={chartConfig.fontSize}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8' }}
                    interval={isMobile ? 'preserveStartEnd' : 0}
                  />
                  <YAxis 
                    stroke="#94A3B8"
                    fontSize={chartConfig.fontSize}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94A3B8' }}
                    tickFormatter={(value) => isMobile ? `$${value.toFixed(2)}` : `$${value.toFixed(4)}`}
                    width={chartConfig.yAxisWidth}
                    domain={['dataMin', 'dataMax']}
                    allowDecimals={true}
                    scale="linear"
                  />
                  <Tooltip content={<VonTooltip />} />
                  <defs>
                    <linearGradient id="VonPriceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="VonPriceLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06B6D4"/>
                      <stop offset="50%" stopColor="#3B82F6"/>
                      <stop offset="100%" stopColor="#6366F1"/>
                    </linearGradient>
                  </defs>
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="url(#VonPriceLine)"
                    strokeWidth={chartConfig.strokeWidth}
                    dot={false}
                    activeDot={{ 
                      r: chartConfig.dotRadius, 
                      fill: '#06B6D4', 
                      stroke: '#0891B2', 
                      strokeWidth: 2,
                      filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.5))'
                    }}
                    fill="url(#VonPriceGradient)"
                  />
                  <ReferenceLine 
                    y={currentPrice} 
                    stroke="#10B981" 
                    strokeDasharray="4 4"
                    strokeOpacity={0.8}
                    strokeWidth={isMobile ? 1 : 2}
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














