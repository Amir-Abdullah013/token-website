'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Rectangle
} from 'recharts';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { useVon } from '@/lib/Von-context';

// Time filter options
const TIME_FILTERS = [
  { label: '1H', value: '1h', interval: '1h' },
  { label: '1D', value: '1d', interval: '1d' },
  { label: '7D', value: '7d', interval: '1d' },
  { label: '30D', value: '30d', interval: '1d' }
];

// Custom Candlestick shape component
const CandlestickShape = (props) => {
  const { x, y, width, height, open, close, high, low } = props;
  
  if (!x || !y || !width || !height) return null;
  
  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#ef4444'; // Green for up, red for down
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const bodyHeight = Math.abs(close - open) || 1; // Minimum 1px for visibility
  const wickTop = high;
  const wickBottom = low;
  
  const bodyY = y + (Math.max(open, close) - high) * height / (high - low || 1);
  const bodyH = bodyHeight * height / (high - low || 1);
  
  return (
    <g>
      {/* Wick line */}
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={color}
        strokeWidth={2}
      />
      {/* Body rectangle */}
      <Rectangle
        x={x + width * 0.2}
        y={bodyY}
        width={width * 0.6}
        height={Math.max(bodyH, 2)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// Custom tooltip for candlestick
const CandlestickTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-md p-3 border-2 border-cyan-500/50 rounded-lg shadow-2xl">
        <p className="text-xs text-slate-300 mb-2 font-medium">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400 text-xs">Open:</span>
            <span className="text-white text-xs font-medium">${data.open.toFixed(6)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400 text-xs">High:</span>
            <span className="text-green-400 text-xs font-medium">${data.high.toFixed(6)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400 text-xs">Low:</span>
            <span className="text-red-400 text-xs font-medium">${data.low.toFixed(6)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400 text-xs">Close:</span>
            <span className="text-white text-xs font-medium">${data.close.toFixed(6)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-600/50 pt-1 mt-1">
            <span className="text-slate-400 text-xs">Volume:</span>
            <span className="text-cyan-400 text-xs font-medium">{data.volume?.toLocaleString() || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Generate candlestick data from price history
const generateCandlestickData = (timeFilter, currentPrice) => {
  const now = new Date();
  let startTime, interval, points, timeUnit;
  
  switch (timeFilter) {
    case '1h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      interval = 60 * 60 * 1000; // 1 hour intervals
      points = 24;
      timeUnit = 'hour';
      break;
    case '1d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      interval = 24 * 60 * 60 * 1000; // 1 day intervals
      points = 7;
      timeUnit = 'day';
      break;
    case '7d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      interval = 24 * 60 * 60 * 1000; // 1 day intervals
      points = 30;
      timeUnit = 'day';
      break;
    case '30d':
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      interval = 24 * 60 * 60 * 1000; // 1 day intervals
      points = 90;
      timeUnit = 'day';
      break;
    default:
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = 24 * 60 * 60 * 1000;
      points = 7;
      timeUnit = 'day';
  }
  
  const candles = [];
  let basePrice = currentPrice * 0.95; // Start slightly below current
  
  for (let i = 0; i < points; i++) {
    const candleStart = new Date(startTime.getTime() + (i * interval));
    const candleEnd = new Date(startTime.getTime() + ((i + 1) * interval));
    
    // Generate OHLC with realistic volatility
    const volatility = 0.02; // 2% volatility
    const trend = (Math.random() - 0.5) * 0.005; // Small trend
    const open = basePrice;
    const change = (Math.random() - 0.5) * volatility + trend;
    const close = open * (1 + change);
    
    // High and low within the candle period
    const highRange = Math.abs(change) * 1.5;
    const high = Math.max(open, close) * (1 + Math.random() * highRange);
    const low = Math.min(open, close) * (1 - Math.random() * highRange);
    
    // Ensure prices stay within reasonable bounds
    const minPrice = currentPrice * 0.5;
    const maxPrice = currentPrice * 1.5;
    
    candles.push({
      timestamp: candleStart.toISOString(),
      time: candleStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      date: candleStart.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      open: Math.max(minPrice, Math.min(maxPrice, open)),
      high: Math.max(minPrice, Math.min(maxPrice, high)),
      low: Math.max(minPrice, Math.min(maxPrice, low)),
      close: Math.max(minPrice, Math.min(maxPrice, close)),
      volume: Math.floor(Math.random() * 5000000) + 500000
    });
    
    basePrice = close; // Next candle opens at previous close
  }
  
  // Add current price as last candle
  candles.push({
    timestamp: now.toISOString(),
    time: now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    date: now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    open: currentPrice * 0.999,
    high: currentPrice * 1.001,
    low: currentPrice * 0.998,
    close: currentPrice,
    volume: Math.floor(Math.random() * 5000000) + 500000
  });
  
  return candles;
};

const CandlestickChart = ({ className = '' }) => {
  const { VonPrice, formatCurrency } = useVon();
  const [selectedFilter, setSelectedFilter] = useState('1d');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Generate candlestick data
  useEffect(() => {
    setIsLoading(true);
    
    const timeoutId = setTimeout(() => {
      const data = generateCandlestickData(selectedFilter, VonPrice);
      setChartData(data);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [selectedFilter, VonPrice]);
  
  // Calculate Y-axis domain
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0 || !VonPrice) {
      return [0, 0.01];
    }
    
    const highs = chartData.map(d => d.high);
    const lows = chartData.map(d => d.low);
    const minPrice = Math.min(...lows);
    const maxPrice = Math.max(...highs);
    const range = maxPrice - minPrice;
    const padding = range * 0.1;
    
    return [
      Math.max(0, minPrice - padding),
      maxPrice + padding
    ];
  }, [chartData, VonPrice]);
  
  // Calculate price change
  const priceChangeInfo = useMemo(() => {
    if (chartData.length < 2) return { change: 0, percent: 0, color: 'text-gray-500' };
    
    const firstClose = chartData[0].close;
    const lastClose = chartData[chartData.length - 1].close;
    const change = lastClose - firstClose;
    const percent = firstClose > 0 ? ((change / firstClose) * 100) : 0;
    
    return {
      change,
      percent,
      color: change >= 0 ? 'text-green-500' : 'text-red-500',
      icon: change >= 0 ? '📈' : '📉'
    };
  }, [chartData]);
  
  // Custom shape for candlestick bars
  const renderCandlestick = (props) => {
    const { x, y, width, height } = props;
    const data = props.payload;
    
    if (!data || !x || !y || !width) return null;
    
    const isUp = data.close >= data.open;
    const color = isUp ? '#10b981' : '#ef4444';
    const bodyHeight = Math.abs(data.close - data.open) || 0.0001;
    const range = data.high - data.low || 0.0001;
    
    // Calculate positions relative to the chart
    const highY = y;
    const lowY = y + height;
    const openY = y + ((data.high - data.open) / range) * height;
    const closeY = y + ((data.high - data.close) / range) * height;
    const bodyTop = Math.min(openY, closeY);
    const bodyBottom = Math.max(openY, closeY);
    const bodyHeightPx = Math.max(Math.abs(bodyBottom - bodyTop), 2);
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={highY}
          x2={x + width / 2}
          y2={lowY}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Body */}
        <rect
          x={x + width * 0.15}
          y={bodyTop}
          width={width * 0.7}
          height={bodyHeightPx}
          fill={color}
          stroke={color}
          strokeWidth={0.5}
        />
      </g>
    );
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border border-slate-600/30 backdrop-blur-sm shadow-xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              VON Candlestick Chart
            </CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-slate-300 font-medium">Time Range:</span>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {TIME_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={selectedFilter === filter.value ? 'default' : 'outline'}
                    onClick={() => setSelectedFilter(filter.value)}
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
          {/* Price Info */}
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-lg p-3 sm:p-4 border border-slate-600/30 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-slate-300 font-medium">Current Von Price</p>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  {VonPrice < 0.01 ? `$${VonPrice.toFixed(6)}` : formatCurrency(VonPrice, 'USD')}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div className={`flex items-center justify-center sm:justify-end text-xs sm:text-sm font-semibold ${priceChangeInfo.color}`}>
                  <span className="mr-1">{priceChangeInfo.icon}</span>
                  <span>
                    {priceChangeInfo.change >= 0 ? '+' : ''}
                    {Math.abs(priceChangeInfo.change) < 0.01 
                      ? `$${priceChangeInfo.change.toFixed(6)}` 
                      : formatCurrency(priceChangeInfo.change, 'USD')} 
                    ({priceChangeInfo.percent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          {isLoading ? (
            <div className={`bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-lg p-2 sm:p-4 border border-slate-600/20 ${
              isMobile ? 'h-64' : 'h-64 sm:h-80 lg:h-96'
            } flex items-center justify-center`}>
              <div className="text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                <p>Loading chart...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className={`bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-lg p-2 sm:p-4 border border-slate-600/20 ${
              isMobile ? 'h-64' : 'h-64 sm:h-80 lg:h-96'
            } flex items-center justify-center`}>
              <p className="text-slate-400">No data available</p>
            </div>
          ) : (
            <div className={`bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-lg p-2 sm:p-4 border border-slate-600/20 ${
              isMobile ? 'h-64' : 'h-64 sm:h-80 lg:h-96'
            }`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickFormatter={(value) => {
                      if (value < 0.01) return `$${value.toFixed(6)}`;
                      return `$${value.toFixed(4)}`;
                    }}
                    width={80}
                    domain={yAxisDomain}
                    allowDecimals={true}
                  />
                  <Tooltip content={<CandlestickTooltip />} />
                  
                  {/* Candlesticks using Bar with custom shape */}
                  <Bar
                    dataKey="high"
                    shape={renderCandlestick}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                  
                  <ReferenceLine 
                    y={VonPrice} 
                    stroke="#10B981" 
                    strokeDasharray="5 5"
                    strokeOpacity={0.6}
                    strokeWidth={1.5}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs text-slate-400 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-lg p-2 sm:p-3 border border-slate-600/20">
            <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span className="text-slate-200 font-medium text-xs sm:text-sm">Bullish</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                <span className="text-slate-200 font-medium text-xs sm:text-sm">Bearish</span>
              </div>
            </div>
            <div className="text-center sm:text-right text-slate-300 font-medium text-xs sm:text-sm">
              {chartData.length} candles
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandlestickChart;


