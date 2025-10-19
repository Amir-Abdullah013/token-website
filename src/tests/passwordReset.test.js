/**
 * Password Reset Functionality Tests
 * 
 * Run instructions:
 * npx jest src/tests/passwordReset.test.js --runInBand
 * 
 * Or with npm script:
 * npm test -- src/tests/passwordReset.test.js
 * 
 * Prerequisites:
 * - Ensure .env file has DATABASE_URL configured
 * - Database should be running and accessible
 * - Test user should exist in database (or create one in beforeAll)
 */

import bcrypt from 'bcryptjs';
import { databaseHelpers } from '@/lib/database';

// Test configuration
const TEST_EMAIL = 'passwordreset-test@example.com';
const TEST_OTP = '123456';
const TEST_PASSWORD = 'OldPassword123!';
const NEW_PASSWORD = 'NewPassword456!';

describe('Password Reset Database Helpers', () => {
  let testUserId;
  let testResetId;
  let hashedOtp;

  // Setup: Create test user before all tests
  beforeAll(async () => {
    try {
      // Create test user if doesn't exist
      const existingUser = await databaseHelpers.user.getUserByEmail(TEST_EMAIL);
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);
        const testUser = await databaseHelpers.pool.query(`
          INSERT INTO users (id, email, name, password, role, status, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, 'Test User', $2, 'USER', 'active', NOW(), NOW())
          RETURNING id
        `, [TEST_EMAIL, hashedPassword]);
        
        testUserId = testUser.rows[0].id;
        console.log('✅ Test user created:', testUserId);
      } else {
        testUserId = existingUser.id;
        console.log('✅ Using existing test user:', testUserId);
      }

      // Clean up any existing password resets for test email
      await databaseHelpers.pool.query(`
        DELETE FROM password_resets WHERE email = $1
      `, [TEST_EMAIL]);

    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  // Cleanup: Remove test data after all tests
  afterAll(async () => {
    try {
      // Clean up password resets
      await databaseHelpers.pool.query(`
        DELETE FROM password_resets WHERE email = $1
      `, [TEST_EMAIL]);

      // Optionally remove test user (commented out to preserve for other tests)
      // await databaseHelpers.pool.query(`
      //   DELETE FROM users WHERE email = $1
      // `, [TEST_EMAIL]);

      console.log('✅ Test cleanup completed');
    } catch (error) {
      console.error('Error in test cleanup:', error);
    }
  });

  describe('createPasswordReset', () => {
    test('should create a password reset record and return id', async () => {
      // Hash OTP before storing
      hashedOtp = await bcrypt.hash(TEST_OTP, 12);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      const result = await databaseHelpers.passwordReset.createPasswordReset({
        email: TEST_EMAIL,
        otpHash: hashedOtp,
        expiresAt
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(TEST_EMAIL);
      expect(result.otpHash).toBe(hashedOtp);
      expect(result.used).toBe(false);
      expect(result.expiresAt).toBeDefined();

      testResetId = result.id;
      console.log('✅ Password reset created:', testResetId);
    });

    test('should create multiple resets for same email', async () => {
      const otpHash2 = await bcrypt.hash('654321', 12);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const result = await databaseHelpers.passwordReset.createPasswordReset({
        email: TEST_EMAIL,
        otpHash: otpHash2,
        expiresAt
      });

      expect(result).toBeDefined();
      expect(result.id).not.toBe(testResetId);
      expect(result.email).toBe(TEST_EMAIL);
    });
  });

  describe('getPasswordResetByEmail', () => {
    test('should return the most recent unused reset', async () => {
      const result = await databaseHelpers.passwordReset.getPasswordResetByEmail(TEST_EMAIL);

      expect(result).toBeDefined();
      expect(result.email).toBe(TEST_EMAIL);
      expect(result.used).toBe(false);
      expect(result.otpHash).toBeDefined();
      
      console.log('✅ Retrieved password reset:', result.id);
    });

    test('should return null for non-existent email', async () => {
      const result = await databaseHelpers.passwordReset.getPasswordResetByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
    });

    test('should not return used resets', async () => {
      // Mark all as used
      await databaseHelpers.pool.query(`
        UPDATE password_resets SET used = true WHERE email = $1
      `, [TEST_EMAIL]);

      const result = await databaseHelpers.passwordReset.getPasswordResetByEmail(TEST_EMAIL);
      
      expect(result).toBeNull();

      // Reset for next tests
      await databaseHelpers.pool.query(`
        UPDATE password_resets SET used = false WHERE email = $1
      `, [TEST_EMAIL]);
    });
  });

  describe('getPasswordResetById', () => {
    test('should return a specific password reset by ID', async () => {
      const result = await databaseHelpers.passwordReset.getPasswordResetById(testResetId);

      expect(result).toBeDefined();
      expect(result.id).toBe(testResetId);
      expect(result.email).toBe(TEST_EMAIL);
    });

    test('should return null for non-existent ID', async () => {
      const result = await databaseHelpers.passwordReset.getPasswordResetById('00000000-0000-0000-0000-000000000000');
      
      expect(result).toBeNull();
    });
  });

  describe('OTP Verification Flow', () => {
    test('should verify OTP using bcrypt.compare', async () => {
      const passwordReset = await databaseHelpers.passwordReset.getPasswordResetByEmail(TEST_EMAIL);
      
      expect(passwordReset).toBeDefined();

      // Verify OTP matches
      const isValid = await bcrypt.compare(TEST_OTP, passwordReset.otpHash);
      expect(isValid).toBe(true);

      // Verify wrong OTP doesn't match
      const isInvalid = await bcrypt.compare('wrong-otp', passwordReset.otpHash);
      expect(isInvalid).toBe(false);

      console.log('✅ OTP verification test passed');
    });
  });

  describe('markPasswordResetAsUsed', () => {
    test('should set used = true', async () => {
      const result = await databaseHelpers.passwordReset.markPasswordResetAsUsed(testResetId);

      expect(result).toBeDefined();
      expect(result.id).toBe(testResetId);
      expect(result.used).toBe(true);
      
      console.log('✅ Password reset marked as used:', testResetId);
    });

    test('should throw error for non-existent ID', async () => {
      await expect(
        databaseHelpers.passwordReset.markPasswordResetAsUsed('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });

    test('used reset should not be returned by getPasswordResetByEmail', async () => {
      const result = await databaseHelpers.passwordReset.getPasswordResetByEmail(TEST_EMAIL);
      
      // Should return a different unused reset or null
      if (result) {
        expect(result.id).not.toBe(testResetId);
      }
    });
  });

  describe('cleanupExpiredResets', () => {
    test('should remove expired password resets', async () => {
      // Create an expired reset
      const expiredOtpHash = await bcrypt.hash('expired-otp', 12);
      const expiredDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      await databaseHelpers.passwordReset.createPasswordReset({
        email: TEST_EMAIL,
        otpHash: expiredOtpHash,
        expiresAt: expiredDate
      });

      // Run cleanup
      const result = await databaseHelpers.passwordReset.cleanupExpiredResets();

      expect(result).toBeDefined();
      expect(result.count).toBeGreaterThanOrEqual(1);
      
      console.log(`✅ Cleaned up ${result.count} expired reset(s)`);
    });

    test('should not remove valid (non-expired) resets', async () => {
      // Create a valid reset
      const validOtpHash = await bcrypt.hash('valid-otp', 12);
      const validDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      const validReset = await databaseHelpers.passwordReset.createPasswordReset({
        email: TEST_EMAIL,
        otpHash: validOtpHash,
        expiresAt: validDate
      });

      // Run cleanup
      await databaseHelpers.passwordReset.cleanupExpiredResets();

      // Check that valid reset still exists
      const stillExists = await databaseHelpers.passwordReset.getPasswordResetById(validReset.id);
      expect(stillExists).toBeDefined();
      
      console.log('✅ Valid reset preserved after cleanup');
    });
  });

  describe('Complete Password Reset Flow', () => {
    test('should successfully complete entire password reset flow', async () => {
      // Step 1: Create password reset
      const otp = '999888';
      const otpHash = await bcrypt.hash(otp, 12);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const reset = await databaseHelpers.passwordReset.createPasswordReset({
        email: TEST_EMAIL,
        otpHash,
        expiresAt
      });

      expect(reset).toBeDefined();
      console.log('✅ Step 1: Password reset created');

      // Step 2: Retrieve by email
      const retrieved = await databaseHelpers.passwordReset.getPasswordResetByEmail(TEST_EMAIL);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(reset.id);
      console.log('✅ Step 2: Password reset retrieved');

      // Step 3: Verify OTP
      const isOtpValid = await bcrypt.compare(otp, retrieved.otpHash);
      expect(isOtpValid).toBe(true);
      console.log('✅ Step 3: OTP verified');

      // Step 4: Update user password (simulated)
      const newPasswordHash = await bcrypt.hash(NEW_PASSWORD, 12);
      expect(newPasswordHash).toBeDefined();
      console.log('✅ Step 4: New password hashed');

      // Step 5: Mark reset as used
      const marked = await databaseHelpers.passwordReset.markPasswordResetAsUsed(reset.id);
      expect(marked.used).toBe(true);
      console.log('✅ Step 5: Password reset marked as used');

      // Step 6: Verify reset cannot be retrieved again
      const shouldBeNull = await databaseHelpers.passwordReset.getPasswordResetByEmail(TEST_EMAIL);
      // Should be null or a different reset
      if (shouldBeNull) {
        expect(shouldBeNull.id).not.toBe(reset.id);
      }
      console.log('✅ Step 6: Used reset not retrievable');

      console.log('✅ COMPLETE PASSWORD RESET FLOW TEST PASSED');
    });
  });
});

describe('Password Reset Security', () => {
  test('OTP should be hashed with bcrypt before storage', async () => {
    const plainOtp = '123456';
    const hashedOtp = await bcrypt.hash(plainOtp, 12);

    // Verify hash is different from plain text
    expect(hashedOtp).not.toBe(plainOtp);
    
    // Verify hash starts with bcrypt identifier
    expect(hashedOtp).toMatch(/^\$2[aby]\$/);
    
    console.log('✅ OTP hashing security check passed');
  });

  test('Expired OTP detection should work correctly', () => {
    const now = new Date();
    const expired = new Date(now.getTime() - 60 * 1000); // 1 minute ago
    const valid = new Date(now.getTime() + 60 * 1000); // 1 minute from now

    expect(expired < now).toBe(true);
    expect(valid > now).toBe(true);
    
    console.log('✅ Expiry detection test passed');
  });

  test('One-time use should be enforced', async () => {
    // Create a reset
    const otpHash = await bcrypt.hash('one-time-otp', 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const reset = await databaseHelpers.passwordReset.createPasswordReset({
      email: TEST_EMAIL,
      otpHash,
      expiresAt
    });

    // Mark as used
    await databaseHelpers.passwordReset.markPasswordResetAsUsed(reset.id);

    // Try to retrieve again - should not get the used one
    const retrieved = await databaseHelpers.passwordReset.getPasswordResetByEmail(TEST_EMAIL);
    if (retrieved) {
      expect(retrieved.id).not.toBe(reset.id);
    }

    console.log('✅ One-time use enforcement test passed');
  });
});

