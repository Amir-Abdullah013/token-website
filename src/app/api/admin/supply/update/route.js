import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../../../lib/database';

/**
 * Admin Supply Update Endpoint
 * Allows admin to transfer tokens from admin reserve to user supply
 * This is the ONLY way to increase user supply in the controlled economy
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { adminId, amount, reason } = body;

    // Validate input
    if (!adminId || !amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request. adminId and positive amount are required.'
      }, { status: 400 });
    }

    // Verify admin authentication and authorization
    try {
      const admin = await databaseHelpers.user.getUserById(adminId);
      
      if (!admin) {
        return NextResponse.json({
          success: false,
          error: 'Admin user not found'
        }, { status: 404 });
      }

      if (admin.role !== 'ADMIN' && admin.role !== 'admin') {
        return NextResponse.json({
          success: false,
          error: 'Unauthorized. Only admins can transfer supply.'
        }, { status: 403 });
      }
    } catch (authError) {
      console.error('Admin auth error:', authError);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify admin authorization'
      }, { status: 500 });
    }

    // Perform the supply transfer
    console.log('🔐 Admin supply transfer initiated:', {
      adminId,
      amount,
      reason: reason || 'No reason provided'
    });

    const result = await databaseHelpers.adminSupplyTransfer.transferToUserSupply(
      adminId,
      amount,
      reason
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to transfer supply'
      }, { status: 400 });
    }

    // Get updated token value
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${amount} TIKI from admin reserve to user supply`,
      transfer: {
        id: result.transfer.id,
        amount: Number(result.transfer.amount),
        adminId: result.transfer.adminId,
        reason: result.transfer.reason,
        createdAt: result.transfer.createdAt
      },
      updatedSupply: {
        totalSupply: Number(result.updatedSupply.totalSupply),
        userSupplyRemaining: Number(result.updatedSupply.userSupplyRemaining),
        adminReserve: Number(result.updatedSupply.adminReserve)
      },
      tokenValue: {
        currentPrice: tokenValue.currentTokenValue,
        inflationFactor: tokenValue.inflationFactor,
        usagePercentage: tokenValue.usagePercentage
      }
    });

  } catch (error) {
    console.error('Error in admin supply update:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update supply'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve supply transfer history
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get transfer history
    const history = await databaseHelpers.adminSupplyTransfer.getTransferHistory(
      adminId,
      limit
    );

    // Get transfer stats
    const stats = await databaseHelpers.adminSupplyTransfer.getTransferStats();

    // Get current supply status
    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    const tokenValue = await databaseHelpers.tokenValue.getCurrentTokenValue();

    return NextResponse.json({
      success: true,
      history: history.map(t => ({
        id: t.id,
        adminId: t.adminId,
        adminName: t.admin_name,
        adminEmail: t.admin_email,
        amount: Number(t.amount),
        fromReserve: Number(t.fromReserve),
        toUserSupply: Number(t.toUserSupply),
        reason: t.reason,
        createdAt: t.createdAt
      })),
      stats: {
        totalTransfers: Number(stats.total_transfers),
        totalTransferred: Number(stats.total_transferred),
        firstTransfer: stats.first_transfer,
        lastTransfer: stats.last_transfer
      },
      currentSupply: {
        totalSupply: Number(tokenSupply.totalSupply),
        userSupplyRemaining: Number(tokenSupply.userSupplyRemaining),
        adminReserve: Number(tokenSupply.adminReserve),
        currentPrice: tokenValue.currentTokenValue,
        inflationFactor: tokenValue.inflationFactor,
        usagePercentage: tokenValue.usagePercentage
      }
    });

  } catch (error) {
    console.error('Error getting supply history:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve supply history'
    }, { status: 500 });
  }
}

