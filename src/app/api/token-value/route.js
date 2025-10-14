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

    // Get current token value
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();

    return NextResponse.json({
      success: true,
      data: {
        baseValue: tokenValue.baseValue,
        currentValue: tokenValue.currentTokenValue,
        inflationFactor: tokenValue.inflationFactor,
        totalSupply: tokenValue.totalSupply,
        remainingSupply: tokenValue.remainingSupply,
        calculatedAt: tokenValue.calculatedAt,
        error: tokenValue.error || null
      }
    });

  } catch (error) {
    console.error('Error fetching token value:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token value' },
      { status: 500 }
    );
  }
}
