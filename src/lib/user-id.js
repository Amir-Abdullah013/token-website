import { randomUUID } from 'crypto';

/**
 * Generate a unique user ID for transfers
 * Format: TIKI-XXXX-XXXX-XXXX (where X is alphanumeric)
 */
export function generateUserId() {
  const uuid = randomUUID();
  const cleanUuid = uuid.replace(/-/g, '').toUpperCase();
  
  // Format as TIKI-XXXX-XXXX-XXXX
  const formatted = `TIKI-${cleanUuid.substring(0, 4)}-${cleanUuid.substring(4, 8)}-${cleanUuid.substring(8, 12)}`;
  
  return formatted;
}

/**
 * Validate user ID format
 */
export function isValidUserId(userId) {
  const pattern = /^TIKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(userId);
}

/**
 * Extract user ID from various formats
 */
export function extractUserId(input) {
  if (!input) return null;
  
  // Remove any whitespace
  const clean = input.trim().toUpperCase();
  
  // Check if it's already in correct format
  if (isValidUserId(clean)) {
    return clean;
  }
  
  // Try to extract from different formats
  const patterns = [
    /TIKI-?([A-Z0-9]{4})-?([A-Z0-9]{4})-?([A-Z0-9]{4})/,
    /([A-Z0-9]{4})-?([A-Z0-9]{4})-?([A-Z0-9]{4})/
  ];
  
  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match) {
      if (clean.startsWith('TIKI')) {
        return `TIKI-${match[1]}-${match[2]}-${match[3]}`;
      } else {
        return `TIKI-${match[1]}-${match[2]}-${match[3]}`;
      }
    }
  }
  
  return null;
}

/**
 * Format user ID for display
 */
export function formatUserId(userId) {
  if (!userId) return '';
  return userId.toUpperCase();
}

/**
 * Create a short display version of user ID
 */
export function getShortUserId(userId) {
  if (!userId) return '';
  const parts = userId.split('-');
  if (parts.length >= 4) {
    return `${parts[1]}...${parts[3]}`;
  }
  return userId;
}
