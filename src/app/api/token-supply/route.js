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

    // Calculate usage statistics
    const totalSupply = Number(tokenSupply.totalSupply);
    const remainingSupply = Number(tokenSupply.remainingSupply);
    const usedSupply = totalSupply - remainingSupply;
    const usagePercentage = (usedSupply / totalSupply) * 100;

    return NextResponse.json({
      success: true,
      data: {
        totalSupply,
        remainingSupply,
        usedSupply,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        tokenValue: {
          baseValue: tokenValue.baseValue,
          currentValue: tokenValue.currentTokenValue,
          inflationFactor: tokenValue.inflationFactor,
          calculatedAt: tokenValue.calculatedAt
        },
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
