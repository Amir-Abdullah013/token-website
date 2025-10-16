import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

/**
 * GET /api/admin/fee-config
 * Get current fee configuration
 */
export async function GET() {
  try {
    const feeConfig = await databaseHelpers.feeConfig.getFeeConfig();
    
    if (!feeConfig) {
      // Return default configuration if none exists
      return NextResponse.json({
        success: true,
        data: {
          transactionFeeRate: 0.05,
          feeReceiverId: 'ADMIN_WALLET',
          isActive: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: feeConfig
    });
  } catch (error) {
    console.error('Error getting fee config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get fee configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/fee-config
 * Update fee configuration
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { transactionFeeRate, feeReceiverId, isActive, adminId } = body;

    // Validate input
    if (transactionFeeRate === undefined || feeReceiverId === undefined || isActive === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate fee rate
    if (transactionFeeRate < 0 || transactionFeeRate > 1) {
      return NextResponse.json(
        { success: false, error: 'Fee rate must be between 0 and 1 (0% to 100%)' },
        { status: 400 }
      );
    }

    // Update fee configuration
    const updatedConfig = await databaseHelpers.feeConfig.updateFeeConfig({
      transactionFeeRate,
      feeReceiverId,
      isActive
    });

    // Log admin action
    if (adminId) {
      await databaseHelpers.adminLog.createAdminLog({
        adminId,
        action: 'UPDATE_FEE_CONFIG',
        targetType: 'FEE_CONFIG',
        targetId: updatedConfig.id,
        details: `Updated fee rate to ${(transactionFeeRate * 100).toFixed(2)}%, receiver: ${feeReceiverId}, active: ${isActive}`
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'Fee configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating fee config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update fee configuration' },
      { status: 500 }
    );
  }
}





