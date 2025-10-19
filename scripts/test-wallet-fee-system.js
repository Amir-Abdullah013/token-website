/**
 * Comprehensive Wallet Fee System Test
 * 
 * Tests all aspects of the wallet fee system:
 * - User creation with fee scheduling
 * - Referral exemption logic
 * - Fee processing (charge, waive, lock)
 * - Wallet lock enforcement
 * 
 * Run with: node scripts/test-wallet-fee-system.js
 */

import dotenv from 'dotenv';
import { databaseHelpers } from '../src/lib/database.js';
import walletFeeService from '../src/lib/walletFeeService.js';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

dotenv.config();

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);
  
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  try {
    await databaseHelpers.pool.query(`
      DELETE FROM transactions WHERE "userId" IN (
        SELECT id FROM users WHERE email LIKE 'walletfeetest%@test.com'
      )
    `);
    await databaseHelpers.pool.query(`
      DELETE FROM referral_earnings WHERE "referralId" IN (
        SELECT id FROM referrals WHERE "referrerId" IN (
          SELECT id FROM users WHERE email LIKE 'walletfeetest%@test.com'
        )
      )
    `);
    await databaseHelpers.pool.query(`
      DELETE FROM staking WHERE "userId" IN (
        SELECT id FROM users WHERE email LIKE 'walletfeetest%@test.com'
      )
    `);
    await databaseHelpers.pool.query(`
      DELETE FROM referrals WHERE "referrerId" IN (
        SELECT id FROM users WHERE email LIKE 'walletfeetest%@test.com'
      ) OR "referredId" IN (
        SELECT id FROM users WHERE email LIKE 'walletfeetest%@test.com'
      )
    `);
    await databaseHelpers.pool.query(`
      DELETE FROM wallets WHERE "userId" IN (
        SELECT id FROM users WHERE email LIKE 'walletfeetest%@test.com'
      )
    `);
    await databaseHelpers.pool.query(`
      DELETE FROM users WHERE email LIKE 'walletfeetest%@test.com'
    `);
    console.log('✅ Cleanup complete\n');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

// Test 1: Create user with wallet fee scheduling
async function testUserCreation() {
  console.log('\n📝 Test 1: User Creation with Wallet Fee Scheduling');
  
  try {
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    const user = await databaseHelpers.user.createUser({
      email: 'walletfeetest1@test.com',
      password: hashedPassword,
      name: 'Test User 1',
      emailVerified: true,
      role: 'USER'
    });

    await walletFeeService.scheduleWalletFee(user);

    const updatedUser = await databaseHelpers.user.getUserById(user.id);
    const hasDueDate = updatedUser.walletFeeDueAt !== null;
    const dueDate = new Date(updatedUser.walletFeeDueAt);
    const createdDate = new Date(updatedUser.createdAt);
    const daysDiff = Math.round((dueDate - createdDate) / (1000 * 60 * 60 * 24));

    logTest(
      'User created with walletFeeDueAt set to 30 days in future',
      hasDueDate && daysDiff >= 29 && daysDiff <= 31,
      `Due date: ${dueDate.toISOString().split('T')[0]}, Days diff: ${daysDiff}`
    );

    return user;
  } catch (error) {
    logTest('User creation with fee scheduling', false, error.message);
    throw error;
  }
}

// Test 2: Referral exemption check
async function testReferralExemption() {
  console.log('\n📝 Test 2: Referral Exemption Logic');

  try {
    // Create referrer
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    const referrer = await databaseHelpers.user.createUser({
      email: 'walletfeetest2@test.com',
      password: hashedPassword,
      name: 'Test Referrer',
      emailVerified: true,
      role: 'USER'
    });
    await walletFeeService.scheduleWalletFee(referrer);

    // Create referred user
    const referred = await databaseHelpers.user.createUser({
      email: 'walletfeetest3@test.com',
      password: hashedPassword,
      name: 'Test Referred',
      emailVerified: true,
      role: 'USER',
      referrerId: referrer.id
    });

    // Create referral record
    await databaseHelpers.referral.createReferral({
      referrerId: referrer.id,
      referredId: referred.id
    });

    // Create wallet for referred user
    await databaseHelpers.wallet.createWallet(referred.id);
    await databaseHelpers.pool.query(`
      UPDATE wallets SET balance = 100 WHERE "userId" = $1
    `, [referred.id]);

    // Referred user stakes $25
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const staking = await databaseHelpers.staking.createStaking({
      userId: referred.id,
      amountStaked: 25,
      durationDays: 30,
      rewardPercent: 15,
      startDate,
      endDate
    });

    // Check referral exemption
    const exemptionMet = await walletFeeService.checkReferralExemption(
      referrer.id,
      new Date(referrer.walletFeeDueAt)
    );

    logTest(
      'Referral exemption detected when referred user stakes $25',
      exemptionMet,
      `Exemption met: ${exemptionMet}`
    );

    // Test waiver
    const waived = await walletFeeService.handleReferralFeeWaiver(referrer.id);
    const updatedReferrer = await databaseHelpers.user.getUserById(referrer.id);

    logTest(
      'Wallet fee waived for referrer',
      waived && updatedReferrer.walletFeeWaived,
      `Waived: ${updatedReferrer.walletFeeWaived}, Processed: ${updatedReferrer.walletFeeProcessed}`
    );

  } catch (error) {
    logTest('Referral exemption logic', false, error.message);
  }
}

// Test 3: Fee processing - successful charge
async function testFeeCharge() {
  console.log('\n📝 Test 3: Fee Processing - Successful Charge');

  try {
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    const user = await databaseHelpers.user.createUser({
      email: 'walletfeetest4@test.com',
      password: hashedPassword,
      name: 'Test User 4',
      emailVerified: true,
      role: 'USER'
    });

    // Set due date to past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await databaseHelpers.pool.query(`
      UPDATE users SET "walletFeeDueAt" = $1 WHERE id = $2
    `, [pastDate, user.id]);

    // Create wallet with sufficient balance
    await databaseHelpers.wallet.createWallet(user.id);
    await databaseHelpers.pool.query(`
      UPDATE wallets SET balance = 10 WHERE "userId" = $1
    `, [user.id]);

    // Process fee
    const result = await walletFeeService.processWalletFeeForUser(user.id);

    logTest(
      'Fee charged when balance is sufficient',
      result.status === 'charged',
      `Status: ${result.status}, Previous: $${result.previousBalance}, New: $${result.newBalance}`
    );

    // Verify transaction created
    const transaction = await databaseHelpers.pool.query(`
      SELECT * FROM transactions 
      WHERE "userId" = $1 AND type = 'WALLET_FEE'
    `, [user.id]);

    logTest(
      'Transaction record created for fee charge',
      transaction.rows.length === 1,
      `Transactions found: ${transaction.rows.length}`
    );

  } catch (error) {
    logTest('Fee charge processing', false, error.message);
  }
}

// Test 4: Wallet lock when insufficient balance
async function testWalletLock() {
  console.log('\n📝 Test 4: Wallet Lock on Insufficient Balance');

  try {
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    const user = await databaseHelpers.user.createUser({
      email: 'walletfeetest5@test.com',
      password: hashedPassword,
      name: 'Test User 5',
      emailVerified: true,
      role: 'USER'
    });

    // Set due date to past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await databaseHelpers.pool.query(`
      UPDATE users SET "walletFeeDueAt" = $1 WHERE id = $2
    `, [pastDate, user.id]);

    // Create wallet with insufficient balance
    await databaseHelpers.wallet.createWallet(user.id);
    await databaseHelpers.pool.query(`
      UPDATE wallets SET balance = 1 WHERE "userId" = $1
    `, [user.id]);

    // Process fee
    const result = await walletFeeService.processWalletFeeForUser(user.id);

    logTest(
      'Wallet locked when balance is insufficient',
      result.status === 'locked',
      `Status: ${result.status}, Balance: $${result.currentBalance}, Required: $${result.requiredAmount}`
    );

    // Verify lock status
    const updatedUser = await databaseHelpers.user.getUserById(user.id);
    logTest(
      'walletFeeLocked flag set to true',
      updatedUser.walletFeeLocked === true,
      `walletFeeLocked: ${updatedUser.walletFeeLocked}`
    );

  } catch (error) {
    logTest('Wallet lock on insufficient balance', false, error.message);
  }
}

// Test 5: Batch processing
async function testBatchProcessing() {
  console.log('\n📝 Test 5: Batch Fee Processing');

  try {
    // Create multiple users with different statuses
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    
    // User with sufficient balance
    const user6 = await databaseHelpers.user.createUser({
      email: 'walletfeetest6@test.com',
      password: hashedPassword,
      name: 'Test User 6',
      emailVerified: true,
      role: 'USER'
    });
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await databaseHelpers.pool.query(`
      UPDATE users SET "walletFeeDueAt" = $1 WHERE id = $2
    `, [pastDate, user6.id]);
    await databaseHelpers.wallet.createWallet(user6.id);
    await databaseHelpers.pool.query(`
      UPDATE wallets SET balance = 10 WHERE "userId" = $1
    `, [user6.id]);

    // User with insufficient balance
    const user7 = await databaseHelpers.user.createUser({
      email: 'walletfeetest7@test.com',
      password: hashedPassword,
      name: 'Test User 7',
      emailVerified: true,
      role: 'USER'
    });
    await databaseHelpers.pool.query(`
      UPDATE users SET "walletFeeDueAt" = $1 WHERE id = $2
    `, [pastDate, user7.id]);
    await databaseHelpers.wallet.createWallet(user7.id);
    await databaseHelpers.pool.query(`
      UPDATE wallets SET balance = 0.5 WHERE "userId" = $1
    `, [user7.id]);

    // Process all due fees
    const results = await walletFeeService.processAllDueWalletFees();

    logTest(
      'Batch processing handles multiple users',
      results.total >= 2,
      `Processed: ${results.total}, Charged: ${results.charged}, Locked: ${results.locked}`
    );

    logTest(
      'Batch processing tracks success/failure correctly',
      results.charged >= 1 && results.locked >= 1,
      `Charged: ${results.charged}, Locked: ${results.locked}, Errors: ${results.errors}`
    );

  } catch (error) {
    logTest('Batch fee processing', false, error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Wallet Fee System Tests\n');
  console.log('═'.repeat(60));

  try {
    // Cleanup before tests
    await cleanup();

    // Run tests
    await testUserCreation();
    await testReferralExemption();
    await testFeeCharge();
    await testWalletLock();
    await testBatchProcessing();

    // Cleanup after tests
    await cleanup();

    // Print summary
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log(`   Total Tests: ${results.passed + results.failed}`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    if (results.failed === 0) {
      console.log('\n🎉 All tests passed! Wallet Fee System is working correctly.\n');
    } else {
      console.log('\n⚠️  Some tests failed. Review the output above for details.\n');
      console.log('Failed tests:');
      results.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
      console.log();
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    await databaseHelpers.pool.end();
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
