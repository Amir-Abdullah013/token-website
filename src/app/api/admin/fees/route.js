import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';
import { getAllFeeSettings, updateFeeRate, initializeFeeSettings } from '../../../../lib/fees';

export async function GET(request) {
  try {
    console.log('📊 Admin Fees API: Fetching fee settings');

    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check if user is admin
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user || (user.role !== 'ADMIN' && !user.isAdmin)) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Get all fee settings
    const feeSettings = await getAllFeeSettings();
    
    // If no fee settings exist, initialize them
    if (feeSettings.length === 0) {
      console.log('🔧 No fee settings found, initializing defaults...');
      await initializeFeeSettings();
      const newFeeSettings = await getAllFeeSettings();
      
      return NextResponse.json({
        success: true,
        feeSettings: newFeeSettings,
        message: 'Fee settings initialized with default values'
      });
    }

    console.log('✅ Admin Fees API: Successfully fetched fee settings');

    return NextResponse.json({
      success: true,
      feeSettings
    });

  } catch (error) {
    console.error('❌ Admin Fees API: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch fee settings',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    console.log('📊 Admin Fees API: Updating fee settings');

    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check if user is admin
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user || (user.role !== 'ADMIN' && !user.isAdmin)) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    const body = await request.json();
    const { type, rate, isActive } = body;

    // Validate input
    if (!type || rate === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Type and rate are required'
      }, { status: 400 });
    }

    if (rate < 0 || rate > 1) {
      return NextResponse.json({
        success: false,
        error: 'Rate must be between 0 and 1 (0% to 100%)'
      }, { status: 400 });
    }

    if (!['transfer', 'withdraw', 'buy', 'sell'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid transaction type. Must be: transfer, withdraw, buy, or sell'
      }, { status: 400 });
    }

    // Update fee rate
    const result = await updateFeeRate(type, rate, isActive !== false);

    // Log admin action
    try {
      await databaseHelpers.adminLog.createAdminLog({
        adminId: session.id,
        action: 'UPDATE_FEE_RATE',
        targetType: 'FEE_SETTINGS',
        targetId: result.feeSetting.id,
        details: `Updated ${type} fee rate to ${(rate * 100).toFixed(2)}% (active: ${isActive})`
      });
    } catch (logError) {
      console.warn('Failed to log admin action:', logError);
    }

    console.log('✅ Admin Fees API: Successfully updated fee setting');

    return NextResponse.json({
      success: true,
      feeSetting: result.feeSetting,
      message: `${type} fee rate updated to ${(rate * 100).toFixed(2)}%`
    });

  } catch (error) {
    console.error('❌ Admin Fees API: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update fee setting',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('📊 Admin Fees API: Initializing fee settings');

    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check if user is admin
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user || (user.role !== 'ADMIN' && !user.isAdmin)) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Initialize fee settings
    const result = await initializeFeeSettings();

    // Log admin action
    try {
      await databaseHelpers.adminLog.createAdminLog({
        adminId: session.id,
        action: 'INITIALIZE_FEE_SETTINGS',
        targetType: 'FEE_SETTINGS',
        targetId: 'system',
        details: 'Initialized default fee settings for all transaction types'
      });
    } catch (logError) {
      console.warn('Failed to log admin action:', logError);
    }

    console.log('✅ Admin Fees API: Successfully initialized fee settings');

    return NextResponse.json({
      success: true,
      settings: result.settings,
      message: 'Fee settings initialized with default values'
    });

  } catch (error) {
    console.error('❌ Admin Fees API: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize fee settings',
      details: error.message
    }, { status: 500 });
  }
}








