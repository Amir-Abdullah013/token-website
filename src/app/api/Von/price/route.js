import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET() {
  try {
    // Get current price using supply-based calculation
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();
    const currentPrice = tokenValue.currentTokenValue;
    
    console.log('📊 Von price API using supply-based calculation:', {
      currentPrice,
      inflationFactor: tokenValue.inflationFactor,
      userSupplyRemaining: tokenValue.userSupplyRemaining,
      usagePercentage: tokenValue.usagePercentage
    });
    
    return NextResponse.json({
      success: true,
      price: parseFloat(currentPrice.toFixed(6)),
      timestamp: Date.now(),
      source: 'supply-based',
      inflationFactor: tokenValue.inflationFactor,
      userSupplyRemaining: tokenValue.userSupplyRemaining,
      usagePercentage: tokenValue.usagePercentage
    });
  } catch (error) {
    console.error('Von price API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch price',
      price: 0.0035, // Fallback price
      timestamp: Date.now()
    }, { status: 500 });
  }
}
