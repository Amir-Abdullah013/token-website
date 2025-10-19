import { NextResponse } from 'next/server';
import databaseHelpers from '@/lib/database';

export async function GET() {
  try {
    // Get current token value from the database
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    const currentPrice = tokenValue.currentTokenValue;
    const lastUpdate = tokenValue.calculatedAt;
    
    // Get token supply information
    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    const totalSupply = tokenSupply ? Number(tokenSupply.totalSupply) : 10000000;
    const circulatingSupply = tokenSupply ? Number(tokenSupply.userSupplyRemaining) : 2000000;
    
    // Calculate 24h change (simplified - using a mock calculation for now)
    // In a real implementation, you'd store historical prices
    const change24h = Math.random() * 10 - 5; // Random change between -5% and +5%
    const priceChange24h = currentPrice * (change24h / 100);
    
    // Get 24h volume from transactions
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const volumeResult = await databaseHelpers.transaction.getTransactionStats();
    const volume24h = parseFloat(volumeResult.totalCompletedAmount || 0);
    
    // Get trade count
    const tradeCount = parseInt(volumeResult.total || 0);
    const avgTradeSize = volume24h / Math.max(tradeCount, 1);
    
    // Calculate market cap
    const marketCap = currentPrice * totalSupply;
    const circulatingMarketCap = currentPrice * circulatingSupply;
    
    // Calculate 24h high and low (simplified)
    const high24h = currentPrice * (1 + Math.random() * 0.1); // Up to 10% higher
    const low24h = currentPrice * (1 - Math.random() * 0.1); // Up to 10% lower
    
    const marketData = {
      price: currentPrice,
      change24h: parseFloat(change24h.toFixed(2)),
      volume24h: volume24h,
      high24h: high24h,
      low24h: low24h,
      marketCap: marketCap,
      circulatingMarketCap: circulatingMarketCap,
      totalSupply: totalSupply,
      circulatingSupply: circulatingSupply,
      tradeCount: tradeCount,
      avgTradeSize: avgTradeSize,
      lastUpdate: lastUpdate,
      // Additional metrics
      priceChange24h: priceChange24h,
      priceChangePercent: change24h,
      volumeChange24h: 0, // Could be calculated if we had historical volume data
      dominance: 0, // Would need other token data
      rank: 1, // Assuming TIKI is the only token
      allTimeHigh: high24h, // Using 24h high as ATH for now
      allTimeLow: low24h, // Using 24h low as ATL for now
    };
    
    return NextResponse.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching market data:', error);
    
    // Return fallback data if database fails
    const fallbackData = {
      price: 0.0035,
      change24h: 0,
      volume24h: 0,
      high24h: 0.0035,
      low24h: 0.0035,
      marketCap: 0,
      circulatingMarketCap: 0,
      totalSupply: 10000000,
      circulatingSupply: 2000000,
      tradeCount: 0,
      avgTradeSize: 0,
      lastUpdate: new Date().toISOString(),
      priceChange24h: 0,
      priceChangePercent: 0,
      volumeChange24h: 0,
      dominance: 0,
      rank: 1,
      allTimeHigh: 0.0035,
      allTimeLow: 0.0035,
    };
    
    return NextResponse.json({
      success: false,
      data: fallbackData,
      error: 'Failed to fetch market data',
      timestamp: new Date().toISOString()
    });
  }
}
