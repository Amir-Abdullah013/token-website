import { NextResponse } from 'next/server';
import { getAllFeeSettings } from '@/lib/fees';

export async function GET(request) {
  try {
    console.log('📊 Public Fees API: Fetching current fee rates');

    // Get all fee settings (no authentication required for public access)
    const feeSettings = await getAllFeeSettings();
    
    // If no fee settings exist, return default rates
    if (feeSettings.length === 0) {
      const defaultRates = {
        transfer: 0.05,  // 5%
        withdraw: 0.10,  // 10%
        buy: 0.01,       // 1%
        sell: 0.01,      // 1%
      };

      return NextResponse.json({
        success: true,
        feeRates: defaultRates,
        message: 'Using default fee rates'
      });
    }

    // Convert to simple rate object for frontend
    const feeRates = {};
    feeSettings.forEach(setting => {
      feeRates[setting.type] = setting.isActive ? setting.rate : 0;
    });

    console.log('✅ Public Fees API: Successfully fetched fee rates');

    return NextResponse.json({
      success: true,
      feeRates,
      lastUpdated: feeSettings[0]?.updatedAt || new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Public Fees API: Error:', error);
    
    // Return default rates on error
    const defaultRates = {
      transfer: 0.05,  // 5%
      withdraw: 0.10,  // 10%
      buy: 0.01,       // 1%
      sell: 0.01,      // 1%
    };

    return NextResponse.json({
      success: true,
      feeRates: defaultRates,
      message: 'Using default fee rates due to error',
      error: error.message
    });
  }
}









