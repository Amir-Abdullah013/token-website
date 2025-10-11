import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to get price from database
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const currentPrice = await databaseHelpers.tokenStats.getCurrentPrice();
      const stats = await databaseHelpers.tokenStats.getTokenStats();
      
      return NextResponse.json({
        success: true,
        price: currentPrice,
        totalTokens: stats.totalTokens,
        totalInvestment: stats.totalInvestment,
        lastUpdated: stats.lastUpdated,
        source: 'database'
      });
    } catch (dbError) {
      console.warn('Database not available, using fallback price:', dbError.message);
      
      // Fallback to default price
      const fallbackPrice = 0.0035; // Initial price
      
      return NextResponse.json({
        success: true,
        price: fallbackPrice,
        totalTokens: 100000000,
        totalInvestment: 350000,
        lastUpdated: new Date().toISOString(),
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error fetching Tiki price:', error);
    
    // Always return a successful response with fallback data
    return NextResponse.json({
      success: true,
      price: 0.0035,
      totalTokens: 100000000,
      totalInvestment: 350000,
      lastUpdated: new Date().toISOString(),
      source: 'fallback',
      error: 'Using fallback price due to server error'
    });
  }
}

export async function POST(request) {
  try {
    const { investmentChange } = await request.json();
    
    if (typeof investmentChange !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid investment change value' },
        { status: 400 }
      );
    }

    // Try to update price in database
    try {
      const { databaseHelpers } = await import('../../../../lib/database.js');
      const updatedStats = await databaseHelpers.tokenStats.updateTokenStats(investmentChange);
      
      return NextResponse.json({
        success: true,
        price: updatedStats.currentPrice,
        totalTokens: updatedStats.totalTokens,
        totalInvestment: updatedStats.totalInvestment,
        lastUpdated: updatedStats.lastUpdated,
        source: 'database'
      });
    } catch (dbError) {
      console.warn('Database not available for price update:', dbError.message);
      
      // Fallback: calculate price locally
      const currentInvestment = 350000; // Default initial investment
      const totalTokens = 100000000;
      const newInvestment = currentInvestment + investmentChange;
      const newPrice = newInvestment / totalTokens;
      
      return NextResponse.json({
        success: true,
        price: newPrice,
        totalTokens: totalTokens,
        totalInvestment: newInvestment,
        lastUpdated: new Date().toISOString(),
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error updating Tiki price:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update price' },
      { status: 500 }
    );
  }
}





