import { databaseHelpers } from './database.js';

/**
 * Transaction Fee System
 * 
 * This module handles all fee calculations and fee-related operations
 * for the Von Token platform. It provides a centralized way to:
 * - Calculate transaction fees
 * - Credit fees to admin wallet
 * - Manage fee configuration
 */

/**
 * Get fee rate for a specific transaction type from database
 * @param {string} type - Transaction type (transfer, withdraw, buy, sell)
 * @returns {Promise<number>} Fee rate as decimal
 */
export async function getFeeRate(type) {
  try {
    const result = await databaseHelpers.pool.query(
      'SELECT rate, "isActive" FROM fee_settings WHERE type = $1',
      [type]
    );
    
    if (result.rows.length === 0) {
      // Return default rates if not found in database
      const defaultRates = {
        transfer: 0.05,  // 5%
        withdraw: 0.10,  // 10%
        buy: 0.01,       // 1%
        sell: 0.01,      // 1%
      };
      return defaultRates[type] ?? 0.05;
    }
    
    const feeSetting = result.rows[0];
    return feeSetting.isActive ? feeSetting.rate : 0;
  } catch (error) {
    console.error('Error getting fee rate:', error);
    // Return default rates on error
    const defaultRates = {
      transfer: 0.05,  // 5%
      withdraw: 0.10,  // 10%
      buy: 0.01,       // 1%
      sell: 0.01,      // 1%
    };
    return defaultRates[type] ?? 0.05;
  }
}

/**
 * Calculate transaction fee based on amount and transaction type
 * @param {number} amount - The transaction amount
 * @param {string} type - Type of transaction (transfer, withdraw, buy, sell)
 * @returns {Promise<Object>} Fee calculation result
 */
export async function calculateFee(amount, type = "transfer") {
  try {
    // Get dynamic fee rate from database
    const rate = await getFeeRate(type);
    const fee = amount * rate;
    const net = amount - fee;

    // Get system settings for fee receiver
    const settings = await getSystemSettings();
    const feeReceiverId = settings.feeReceiverId || 'ADMIN_WALLET';
    
    console.log(`💸 ${type.toUpperCase()} | Amount: $${amount}, Fee: $${fee.toFixed(2)}, Net: $${net.toFixed(2)} (${(rate * 100).toFixed(1)}%)`);

    return {
      feeRate: rate,
      fee: parseFloat(fee.toFixed(6)),
      net: parseFloat(net.toFixed(6)),
      originalAmount: amount,
      feeAmount: fee,
      netAmount: net,
      feeReceiverId: feeReceiverId,
      transactionType: type,
      isActive: settings.isActive !== false
    };
  } catch (error) {
    console.error('Error calculating fee:', error);
    // Return default calculation if settings fail
    const defaultRate = 0.05;
    const fee = amount * defaultRate;
    const net = amount - fee;
    
    return {
      feeRate: defaultRate,
      fee: parseFloat(fee.toFixed(6)),
      net: parseFloat(net.toFixed(6)),
      originalAmount: amount,
      feeAmount: fee,
      netAmount: net,
      feeReceiverId: 'ADMIN_WALLET',
      transactionType: type,
      isActive: true,
      error: error.message
    };
  }
}

/**
 * Get system fee settings from database
 * @returns {Promise<Object>} Fee configuration
 */
export async function getSystemSettings() {
  try {
    // Try to get fee config from dedicated table first
    const feeConfig = await databaseHelpers.feeConfig.getFeeConfig();
    if (feeConfig) {
      return {
        transactionFeeRate: feeConfig.transactionFeeRate,
        feeReceiverId: feeConfig.feeReceiverId,
        isActive: feeConfig.isActive
      };
    }
    
    // Fallback to system settings
    const feeRateSetting = await databaseHelpers.system.getSetting('transaction_fee_rate');
    const feeReceiverSetting = await databaseHelpers.system.getSetting('fee_receiver_id');
    const isActiveSetting = await databaseHelpers.system.getSetting('fee_system_active');
    
    return {
      transactionFeeRate: feeRateSetting ? parseFloat(feeRateSetting.value) : 0.05,
      feeReceiverId: feeReceiverSetting ? feeReceiverSetting.value : 'ADMIN_WALLET',
      isActive: isActiveSetting ? isActiveSetting.value === 'true' : true
    };
  } catch (error) {
    console.error('Error getting system settings:', error);
    // Return default settings
    return {
      transactionFeeRate: 0.05,
      feeReceiverId: 'ADMIN_WALLET',
      isActive: true
    };
  }
}

/**
 * Credit fee to admin wallet
 * @param {Object} prisma - Prisma client instance
 * @param {number} feeAmount - Amount to credit
 * @param {string} feeReceiverId - Admin wallet ID
 * @returns {Promise<Object>} Credit result
 */
export async function creditFeeToAdmin(prisma, feeAmount, feeReceiverId = 'ADMIN_WALLET') {
  try {
    if (!feeAmount || feeAmount <= 0) {
      return { success: false, message: 'Invalid fee amount' };
    }

    // Get admin user by ID or email
    let adminUser;
    if (feeReceiverId === 'ADMIN_WALLET') {
      // Find first admin user
      adminUser = await databaseHelpers.user.getAdminUser();
    } else {
      adminUser = await databaseHelpers.user.getUserById(feeReceiverId);
    }

    if (!adminUser) {
      console.error('Admin user not found for fee credit:', feeReceiverId);
      return { success: false, message: 'Admin user not found' };
    }

    // Update admin wallet balance
    const updatedWallet = await databaseHelpers.wallet.updateBalance(adminUser.id, feeAmount);
    
    console.log('✅ Fee credited to admin wallet:', {
      adminId: adminUser.id,
      feeAmount: feeAmount,
      newBalance: updatedWallet.balance
    });

    return {
      success: true,
      adminId: adminUser.id,
      feeAmount: feeAmount,
      newBalance: updatedWallet.balance
    };
  } catch (error) {
    console.error('Error crediting fee to admin:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Create transaction with fee calculation
 * @param {Object} transactionData - Transaction data
 * @param {Object} prisma - Prisma client instance
 * @returns {Promise<Object>} Created transaction with fee data
 */
export async function createTransactionWithFee(transactionData, prisma) {
  try {
    const { userId, type, amount, currency = 'USD', description = null } = transactionData;
    
    // Calculate fee
    const feeCalculation = await calculateFee(amount, type);
    
    if (!feeCalculation.isActive) {
      // Fee system disabled, create transaction without fees
      return await databaseHelpers.transaction.createTransaction({
        ...transactionData,
        feeAmount: 0,
        netAmount: amount,
        feeReceiverId: null,
        transactionType: type
      });
    }

    // Create transaction with fee data
    const transaction = await databaseHelpers.transaction.createTransaction({
      ...transactionData,
      feeAmount: feeCalculation.feeAmount,
      netAmount: feeCalculation.netAmount,
      feeReceiverId: feeCalculation.feeReceiverId,
      transactionType: type
    });

    // Credit fee to admin if transaction is completed
    if (transaction.status === 'COMPLETED' && feeCalculation.feeAmount > 0) {
      await creditFeeToAdmin(prisma, feeCalculation.feeAmount, feeCalculation.feeReceiverId);
    }

    return {
      ...transaction,
      feeCalculation: feeCalculation
    };
  } catch (error) {
    console.error('Error creating transaction with fee:', error);
    throw error;
  }
}

/**
 * Update fee configuration
 * @param {Object} feeConfig - New fee configuration
 * @param {string} adminId - Admin performing the update
 * @returns {Promise<Object>} Update result
 */
export async function updateFeeConfig(feeConfig, adminId = null) {
  try {
    const { transactionFeeRate, feeReceiverId, isActive } = feeConfig;
    
    // Validate fee rate
    if (transactionFeeRate < 0 || transactionFeeRate > 1) {
      throw new Error('Fee rate must be between 0 and 1 (0% to 100%)');
    }

    // Update fee config in database
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

    console.log('✅ Fee configuration updated:', updatedConfig);
    return { success: true, config: updatedConfig };
  } catch (error) {
    console.error('Error updating fee config:', error);
    throw error;
  }
}

/**
 * Get fee statistics
 * @returns {Promise<Object>} Fee statistics
 */
export async function getFeeStats() {
  try {
    const stats = await databaseHelpers.transaction.getFeeStats();
    return {
      totalFeesCollected: stats.totalFeesCollected || 0,
      totalTransactionsWithFees: stats.totalTransactionsWithFees || 0,
      averageFeeAmount: stats.averageFeeAmount || 0,
      lastFeeCollection: stats.lastFeeCollection || null
    };
  } catch (error) {
    console.error('Error getting fee stats:', error);
    return {
      totalFeesCollected: 0,
      totalTransactionsWithFees: 0,
      averageFeeAmount: 0,
      lastFeeCollection: null
    };
  }
}

/**
 * Calculate fee for a specific transaction type
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type
 * @returns {Promise<Object>} Fee calculation
 */
export async function calculateFeeForType(amount, type) {
  const feeCalculation = await calculateFee(amount, type);
  
  return {
    ...feeCalculation,
    displayText: `${(feeCalculation.feeRate * 100).toFixed(2)}% fee ($${feeCalculation.feeAmount.toFixed(2)})`,
    breakdown: {
      original: amount,
      fee: feeCalculation.feeAmount,
      net: feeCalculation.netAmount,
      percentage: feeCalculation.feeRate * 100
    }
  };
}

/**
 * Get all fee settings from database
 * @returns {Promise<Array>} All fee settings
 */
export async function getAllFeeSettings() {
  try {
    const result = await databaseHelpers.pool.query(
      'SELECT * FROM fee_settings ORDER BY type'
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting all fee settings:', error);
    return [];
  }
}

/**
 * Update fee rate for a specific transaction type
 * @param {string} type - Transaction type
 * @param {number} rate - New fee rate
 * @param {boolean} isActive - Whether the fee is active
 * @returns {Promise<Object>} Update result
 */
export async function updateFeeRate(type, rate, isActive = true) {
  try {
    // Validate rate
    if (rate < 0 || rate > 1) {
      throw new Error('Fee rate must be between 0 and 1 (0% to 100%)');
    }

    // Check if fee setting exists
    const existing = await databaseHelpers.pool.query(
      'SELECT id FROM fee_settings WHERE type = $1',
      [type]
    );

    if (existing.rows.length > 0) {
      // Update existing
      const result = await databaseHelpers.pool.query(
        'UPDATE fee_settings SET rate = $1, "isActive" = $2, "updatedAt" = NOW() WHERE type = $3 RETURNING *',
        [rate, isActive, type]
      );
      return { success: true, feeSetting: result.rows[0] };
    } else {
      // Create new
      const result = await databaseHelpers.pool.query(
        'INSERT INTO fee_settings (type, rate, "isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
        [type, rate, isActive]
      );
      return { success: true, feeSetting: result.rows[0] };
    }
  } catch (error) {
    console.error('Error updating fee rate:', error);
    throw error;
  }
}

/**
 * Initialize default fee settings
 * @returns {Promise<Object>} Initialization result
 */
export async function initializeFeeSettings() {
  try {
    const defaultSettings = [
      { type: 'transfer', rate: 0.05, isActive: true },
      { type: 'withdraw', rate: 0.10, isActive: true },
      { type: 'buy', rate: 0.01, isActive: true },
      { type: 'sell', rate: 0.01, isActive: true }
    ];

    const results = [];
    for (const setting of defaultSettings) {
      const result = await updateFeeRate(setting.type, setting.rate, setting.isActive);
      results.push(result);
    }

    console.log('✅ Fee settings initialized:', results);
    return { success: true, settings: results };
  } catch (error) {
    console.error('Error initializing fee settings:', error);
    throw error;
  }
}

export default {
  calculateFee,
  getFeeRate,
  getSystemSettings,
  creditFeeToAdmin,
  createTransactionWithFee,
  updateFeeConfig,
  getFeeStats,
  calculateFeeForType,
  getAllFeeSettings,
  updateFeeRate,
  initializeFeeSettings
};
