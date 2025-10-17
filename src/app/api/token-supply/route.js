import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import { databaseHelpers } from '../../../lib/database';

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details to check admin status
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get token supply data
    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    if (!tokenSupply) {
      return NextResponse.json(
        { success: false, error: 'Token supply not initialized' },
        { status: 404 }
      );
    }

    // Get current token value
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();

    // Validate supply integrity
    const validation = await databaseHelpers.tokenSupply.validateSupply();

    // Calculate comprehensive statistics
    const totalSupply = validation.totalSupply;
    const distributedSupply = validation.distributedSupply;
    const remainingSupply = validation.remainingSupply;
    const userSupplyRemaining = validation.userSupplyRemaining;
    const adminReserve = validation.adminReserve;
    
    // Calculate usage percentages
    const totalUsagePercentage = (distributedSupply / totalSupply) * 100;
    const totalUserSupply = 2000000; // User allocation (20%)
    const usedUserSupply = totalUserSupply - userSupplyRemaining;
    const userSupplyUsagePercentage = (usedUserSupply / totalUserSupply) * 100;

    return NextResponse.json({
      success: true,
      data: {
        // Total supply tracking
        totalSupply,
        distributedSupply: Math.floor(distributedSupply),
        remainingSupply,
        totalUsagePercentage: Math.round(totalUsagePercentage * 100) / 100,
        
        // Allocation management
        userSupplyRemaining,
        usedUserSupply,
        userSupplyUsagePercentage: Math.round(userSupplyUsagePercentage * 100) / 100,
        adminReserve,
        
        // Token value
        tokenValue: {
          baseValue: tokenValue.baseValue,
          currentValue: tokenValue.currentTokenValue,
          inflationFactor: tokenValue.inflationFactor,
          calculatedAt: tokenValue.calculatedAt
        },
        
        // System health
        isValid: validation.isValid,
        discrepancy: validation.discrepancy,
        lastUpdated: tokenSupply.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching token supply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token supply' },
      { status: 500 }
    );
  }
}





