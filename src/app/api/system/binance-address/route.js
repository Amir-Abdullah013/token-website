import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../../lib/database';

export async function GET() {
  try {
    const setting = await databaseHelpers.system.getSetting('BINANCE_DEPOSIT_ADDRESS');
    
    if (!setting) {
      // Return default address if not configured
      return NextResponse.json({
        success: true,
        address: 'TX7k8t9w2ZkDh8mA1pQw6yLbNvF3gHjK9mP2qR5sT8uV1wX4yZ7aBcEfGhJkLmNoPqRsTuVwXyZ'
      });
    }

    return NextResponse.json({
      success: true,
      address: setting.value
    });

  } catch (error) {
    console.error('Error fetching Binance address:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Binance address' },
      { status: 500 }
    );
  }
}







