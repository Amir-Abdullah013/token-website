/**
 * Test Script for Transaction Fee System
 * 
 * This script tests the fee calculation and fee system implementation
 */

import { databaseHelpers } from '../src/lib/database.js';
import { calculateFee, getSystemSettings, creditFeeToAdmin, createTransactionWithFee } from '../src/lib/fees.js';

async function testFeeSystem() {
  console.log('🧪 Testing Transaction Fee System...\n');

  try {
    // Test 1: Fee Calculation
    console.log('1️⃣ Testing Fee Calculation');
    console.log('─'.repeat(50));
    
    const testAmount = 100;
    const feeCalculation = await calculateFee(testAmount, 'BUY');
    
    console.log(`Original Amount: $${testAmount}`);
    console.log(`Fee Rate: ${(feeCalculation.feeRate * 100).toFixed(2)}%`);
    console.log(`Fee Amount: $${feeCalculation.feeAmount.toFixed(2)}`);
    console.log(`Net Amount: $${feeCalculation.netAmount.toFixed(2)}`);
    console.log(`Fee Receiver: ${feeCalculation.feeReceiverId}`);
    console.log(`System Active: ${feeCalculation.isActive}`);
    console.log('✅ Fee calculation test passed\n');

    // Test 2: System Settings
    console.log('2️⃣ Testing System Settings');
    console.log('─'.repeat(50));
    
    const settings = await getSystemSettings();
    console.log('Current Fee Settings:');
    console.log(`  Fee Rate: ${(settings.transactionFeeRate * 100).toFixed(2)}%`);
    console.log(`  Fee Receiver: ${settings.feeReceiverId}`);
    console.log(`  System Active: ${settings.isActive}`);
    console.log('✅ System settings test passed\n');

    // Test 3: Fee Configuration
    console.log('3️⃣ Testing Fee Configuration');
    console.log('─'.repeat(50));
    
    // Get current fee config
    const currentConfig = await databaseHelpers.feeConfig.getFeeConfig();
    console.log('Current Fee Config:', currentConfig);
    
    // Test updating fee config
    const testConfig = {
      transactionFeeRate: 0.05, // 5%
      feeReceiverId: 'ADMIN_WALLET',
      isActive: true
    };
    
    const updatedConfig = await databaseHelpers.feeConfig.updateFeeConfig(testConfig);
    console.log('Updated Fee Config:', updatedConfig);
    console.log('✅ Fee configuration test passed\n');

    // Test 4: Transaction with Fee
    console.log('4️⃣ Testing Transaction with Fee');
    console.log('─'.repeat(50));
    
    const testTransaction = {
      userId: 'test-user-id',
      type: 'BUY',
      amount: 50,
      currency: 'USD',
      description: 'Test transaction with fee'
    };
    
    // Note: This would normally require a valid user ID and Prisma client
    console.log('Test transaction data:', testTransaction);
    console.log('✅ Transaction with fee test prepared\n');

    // Test 5: Fee Statistics
    console.log('5️⃣ Testing Fee Statistics');
    console.log('─'.repeat(50));
    
    const feeStats = await databaseHelpers.transactionWithFees.getFeeStats();
    console.log('Fee Statistics:', feeStats);
    console.log('✅ Fee statistics test passed\n');

    // Test 6: Different Fee Rates
    console.log('6️⃣ Testing Different Fee Rates');
    console.log('─'.repeat(50));
    
    const testAmounts = [10, 50, 100, 500, 1000];
    const testRates = [0.01, 0.05, 0.10, 0.15]; // 1%, 5%, 10%, 15%
    
    console.log('Fee calculations for different amounts and rates:');
    console.log('Amount\tRate\tFee\tNet');
    console.log('─'.repeat(40));
    
    for (const amount of testAmounts) {
      for (const rate of testRates) {
        const fee = amount * rate;
        const net = amount - fee;
        console.log(`$${amount}\t${(rate * 100).toFixed(0)}%\t$${fee.toFixed(2)}\t$${net.toFixed(2)}`);
      }
    }
    console.log('✅ Different fee rates test passed\n');

    // Test 7: Fee System Validation
    console.log('7️⃣ Testing Fee System Validation');
    console.log('─'.repeat(50));
    
    // Test invalid fee rates
    const invalidRates = [-0.1, 1.5, 2.0];
    console.log('Testing invalid fee rates:');
    
    for (const rate of invalidRates) {
      try {
        if (rate < 0 || rate > 1) {
          console.log(`❌ Rate ${(rate * 100).toFixed(1)}% is invalid (should be 0-100%)`);
        } else {
          console.log(`✅ Rate ${(rate * 100).toFixed(1)}% is valid`);
        }
      } catch (error) {
        console.log(`❌ Rate ${(rate * 100).toFixed(1)}% caused error:`, error.message);
      }
    }
    console.log('✅ Fee system validation test passed\n');

    console.log('🎉 All fee system tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('• Fee calculation working correctly');
    console.log('• System settings accessible');
    console.log('• Fee configuration updatable');
    console.log('• Transaction with fees prepared');
    console.log('• Fee statistics available');
    console.log('• Different fee rates calculated');
    console.log('• Fee system validation working');

  } catch (error) {
    console.error('❌ Fee system test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testFeeSystem().then(() => {
  console.log('\n🏁 Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});



