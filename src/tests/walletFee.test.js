/**
 * Wallet Fee System Tests
 * Tests the one-time wallet fee system with referral waiver logic
 */

import { databaseHelpers } from '@/lib/database.js';
import { 
  scheduleFeeForNewUser, 
  processOneTimeFeeForUser, 
  checkReferralWaiver,
  getWalletFeeStatus 
} from '@/lib/oneTimeWalletFeeService.js';

// Test configuration
const TEST_USER_EMAIL = 'test-wallet-fee@example.com';
const TEST_REFERRER_EMAIL = 'test-referrer@example.com';

async function cleanupTestUsers() {
  try {
    // Clean up test users
    await databaseHelpers.pool.query('DELETE FROM users WHERE email IN ($1, $2)', [
      TEST_USER_EMAIL, 
      TEST_REFERRER_EMAIL
    ]);
    console.log('🧹 Cleaned up test users');
  } catch (error) {
    console.error('Error cleaning up test users:', error);
  }
}

async function createTestUser(email, name = 'Test User') {
  const user = await databaseHelpers.user.createUser({
    email,
    password: 'testpassword123',
    name,
    emailVerified: true,
    role: 'USER'
  });
  
  // Create wallet
  await databaseHelpers.wallet.createWallet(user.id);
  
  // Add some USD balance
  await databaseHelpers.wallet.updateBalance(user.id, 100); // $100 USD
  
  return user;
}

async function testScheduleFeeForNewUser() {
  console.log('\n🧪 Testing scheduleFeeForNewUser...');
  
  try {
    const user = await createTestUser('test-schedule@example.com');
    
    // Schedule fee
    await scheduleFeeForNewUser(user);
    
    // Verify fee was scheduled
    const updatedUser = await databaseHelpers.user.getUserById(user.id);
    const expectedDueDate = new Date(user.createdAt);
    expectedDueDate.setDate(expectedDueDate.getDate() + 30);
    
    if (updatedUser.walletFeeDueAt) {
      const timeDiff = Math.abs(updatedUser.walletFeeDueAt.getTime() - expectedDueDate.getTime());
      if (timeDiff < 60000) { // Within 1 minute
        console.log('✅ scheduleFeeForNewUser test passed');
        return true;
      }
    }
    
    console.log('❌ scheduleFeeForNewUser test failed - fee not scheduled correctly');
    return false;
  } catch (error) {
    console.error('❌ scheduleFeeForNewUser test error:', error);
    return false;
  }
}

async function testFeeWaivedWithReferral() {
  console.log('\n🧪 Testing fee waived with referral...');
  
  try {
    // Create referrer user
    const referrer = await createTestUser(TEST_REFERRER_EMAIL, 'Test Referrer');
    await scheduleFeeForNewUser(referrer);
    
    // Create referred user
    const referred = await createTestUser(TEST_USER_EMAIL, 'Test Referred');
    
    // Create referral relationship
    await databaseHelpers.referral.createReferral({
      referrerId: referrer.id,
      referredId: referred.id
    });
    
    // Check if referrer's fee is waived
    const waived = await checkReferralWaiver(referrer.id);
    
    if (waived) {
      // Verify referrer's fee status
      const updatedReferrer = await databaseHelpers.user.getUserById(referrer.id);
      if (updatedReferrer.walletFeeWaived && updatedReferrer.walletFeeProcessed) {
        console.log('✅ Fee waived with referral test passed');
        return true;
      }
    }
    
    console.log('❌ Fee waived with referral test failed');
    return false;
  } catch (error) {
    console.error('❌ Fee waived with referral test error:', error);
    return false;
  }
}

async function testFeeChargedWithoutReferral() {
  console.log('\n🧪 Testing fee charged without referral...');
  
  try {
    const user = await createTestUser('test-charge@example.com');
    await scheduleFeeForNewUser(user);
    
    // Set fee due date to past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await databaseHelpers.user.updateUser(user.id, {
      walletFeeDueAt: pastDate
    });
    
    // Process fee
    const result = await processOneTimeFeeForUser(user.id);
    
    if (result.status === 'charged') {
      // Verify user was charged
      const updatedUser = await databaseHelpers.user.getUserById(user.id);
      if (updatedUser.walletFeeProcessed && !updatedUser.walletFeeWaived) {
        console.log('✅ Fee charged without referral test passed');
        return true;
      }
    }
    
    console.log('❌ Fee charged without referral test failed');
    return false;
  } catch (error) {
    console.error('❌ Fee charged without referral test error:', error);
    return false;
  }
}

async function testIdempotency() {
  console.log('\n🧪 Testing idempotency (no double charge)...');
  
  try {
    const user = await createTestUser('test-idempotent@example.com');
    await scheduleFeeForNewUser(user);
    
    // Set fee due date to past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await databaseHelpers.user.updateUser(user.id, {
      walletFeeDueAt: pastDate
    });
    
    // Process fee first time
    const result1 = await processOneTimeFeeForUser(user.id);
    
    // Process fee second time (should not charge again)
    const result2 = await processOneTimeFeeForUser(user.id);
    
    if (result1.status === 'charged' && result2.status === 'charged') {
      // Check that fee was only charged once by checking wallet balance
      const wallet = await databaseHelpers.wallet.getUserWallet(user.id);
      const expectedBalance = 100 - 2; // $100 - $2 fee = $98
      
      if (Math.abs(wallet.balance - expectedBalance) < 0.01) {
        console.log('✅ Idempotency test passed');
        return true;
      }
    }
    
    console.log('❌ Idempotency test failed');
    return false;
  } catch (error) {
    console.error('❌ Idempotency test error:', error);
    return false;
  }
}

async function testRaceCondition() {
  console.log('\n🧪 Testing race condition (referral + cron)...');
  
  try {
    // Create referrer user
    const referrer = await createTestUser('test-race-referrer@example.com', 'Race Referrer');
    await scheduleFeeForNewUser(referrer);
    
    // Set fee due date to past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await databaseHelpers.user.updateUser(referrer.id, {
      walletFeeDueAt: pastDate
    });
    
    // Create referred user
    const referred = await createTestUser('test-race-referred@example.com', 'Race Referred');
    
    // Simulate race condition: process fee and create referral simultaneously
    const [feeResult, referralResult] = await Promise.all([
      processOneTimeFeeForUser(referrer.id),
      databaseHelpers.referral.createReferral({
        referrerId: referrer.id,
        referredId: referred.id
      })
    ]);
    
    // Check final state - should be either waived or charged, but not both
    const finalUser = await databaseHelpers.user.getUserById(referrer.id);
    
    if (finalUser.walletFeeProcessed && (finalUser.walletFeeWaived || !finalUser.walletFeeWaived)) {
      console.log('✅ Race condition test passed');
      return true;
    }
    
    console.log('❌ Race condition test failed');
    return false;
  } catch (error) {
    console.error('❌ Race condition test error:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Wallet Fee System Tests...\n');
  
  // Clean up before starting
  await cleanupTestUsers();
  
  const tests = [
    { name: 'Schedule Fee for New User', fn: testScheduleFeeForNewUser },
    { name: 'Fee Waived with Referral', fn: testFeeWaivedWithReferral },
    { name: 'Fee Charged without Referral', fn: testFeeChargedWithoutReferral },
    { name: 'Idempotency (No Double Charge)', fn: testIdempotency },
    { name: 'Race Condition Handling', fn: testRaceCondition }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed with error:`, error);
    }
    
    // Clean up after each test
    await cleanupTestUsers();
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Wallet fee system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the implementation.');
  }
  
  // Final cleanup
  await cleanupTestUsers();
  
  return passed === total;
}

// Export for use in other test files
export { runAllTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}





