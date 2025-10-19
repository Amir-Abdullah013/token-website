import { databaseHelpers } from './database.js';

/**
 * Check if wallet is locked for a user
 * Returns an object indicating if the action is allowed
 * @param {string} userId - User ID to check
 * @returns {Promise<Object>} - { allowed: boolean, reason?: string }
 */
export async function checkWalletLock(userId) {
  try {
    const isLocked = await databaseHelpers.walletFee.isWalletLocked(userId);
    
    if (isLocked) {
      return {
        allowed: false,
        reason: 'Wallet is locked due to unpaid wallet fee. Please deposit $2 to unlock your wallet.',
        locked: true
      };
    }

    return { allowed: true, locked: false };
  } catch (error) {
    console.error('Error checking wallet lock:', error);
    // In case of error, allow the action (fail open)
    return { allowed: true, locked: false };
  }
}

/**
 * Create a standardized response for locked wallet
 * @returns {Response} - NextResponse with locked wallet error
 */
export function createWalletLockedResponse() {
  const { NextResponse } = require('next/server');
  
  return NextResponse.json(
    {
      error: 'Wallet Locked',
      message: 'Your wallet is locked due to an unpaid wallet fee. Please deposit at least $2 to unlock your wallet and resume all wallet activities.',
      locked: true,
      requiredDeposit: 2
    },
    { status: 403 }
  );
}

export default {
  checkWalletLock,
  createWalletLockedResponse
};




