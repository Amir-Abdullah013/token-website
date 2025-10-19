import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database.js';

/**
 * Test endpoint to reset wallet fee fields for a user
 * Useful for development and testing
 */
export async function POST(request) {
  try {
    // Only allow in development or with admin auth
    if (process.env.NODE_ENV === 'production') {
      const session = await getServerSession();
      
      if (!session?.id || !session.isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log(`Resetting wallet fee for user ${userId}`);

    // Reset wallet fee fields
    await databaseHelpers.pool.query(`
      UPDATE users 
      SET "walletFeeDueAt" = NOW() + INTERVAL '30 days',
          "walletFeeProcessed" = false,
          "walletFeeWaived" = false,
          "walletFeeLocked" = false,
          "walletFeeProcessedAt" = NULL,
          "updatedAt" = NOW()
      WHERE id = $1
    `, [userId]);

    console.log(`✅ Wallet fee reset for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Wallet fee fields reset successfully',
      userId,
      newDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Error resetting wallet fee:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset wallet fee',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

