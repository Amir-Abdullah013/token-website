import { databaseHelpers } from '../src/lib/database.js';

async function setupBinanceAddress() {
  try {
    console.log('🔧 Setting up Binance deposit address...');
    
    // Set the Binance address (you can change this to your actual address)
    const binanceAddress = 'TX7k8t9w2ZkDh8mA1pQw6yLbNvF3gHjK9mP2qR5sT8uV1wX4yZ7aBcEfGhJkLmNoPqRsTuVwXyZ';
    
    await databaseHelpers.system.setSetting(
      'BINANCE_DEPOSIT_ADDRESS',
      binanceAddress,
      'Binance wallet address for manual deposits'
    );
    
    console.log('✅ Binance address set successfully:', binanceAddress);
  } catch (error) {
    console.error('❌ Error setting up Binance address:', error);
  }
}

setupBinanceAddress();


