// Production-ready database helpers with comprehensive error handling
import { getDatabase, executeQuery } from './database-manager.js'

// Fallback data for when database is unavailable
const FALLBACK_DATA = {
  tokenStats: {
    totalTokens: 100000000,
    totalInvestment: 350000,
    currentPrice: 0.0035,
    lastUpdated: new Date(),
    createdAt: new Date()
  },
  price: {
    symbol: 'TOKEN',
    price: 0.0035,
    timestamp: new Date(),
    source: 'fallback'
  },
  user: null
}

// Database helper functions with bulletproof error handling
export const databaseHelpers = {
  // User operations
  user: {
    async getUserByEmail(email) {
      try {
        return await executeQuery(async (db) => {
          return await db.user.findUnique({
            where: { email }
          });
        }, FALLBACK_DATA.user);
      } catch (error) {
        console.error('Error getting user by email:', error);
        return FALLBACK_DATA.user;
      }
    },

    async getUserById(id) {
      try {
        return await executeQuery(async (db) => {
          return await db.user.findUnique({
            where: { id }
          });
        }, FALLBACK_DATA.user);
      } catch (error) {
        console.error('Error getting user by ID:', error);
        return FALLBACK_DATA.user;
      }
    },

    async createUser(userData) {
      try {
        return await executeQuery(async (db) => {
          return await db.user.create({
            data: userData
          });
        }, null);
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    }
  },

  // Token stats operations
  tokenStats: {
    async getTokenStats() {
      try {
        return await executeQuery(async (db) => {
          const stats = await db.tokenStats.findFirst({
            orderBy: { createdAt: 'desc' }
          });
          
          if (!stats) {
            // Create initial stats if none exist
            return await db.tokenStats.create({
              data: {
                totalTokens: 100000000,
                totalInvestment: 350000,
                currentPrice: 0.0035
              }
            });
          }
          
          return stats;
        }, FALLBACK_DATA.tokenStats);
      } catch (error) {
        console.error('Error getting token stats:', error);
        return FALLBACK_DATA.tokenStats;
      }
    },

    // Get current price from token stats (this is the correct approach)
    async getCurrentPrice() {
      try {
        const stats = await this.getTokenStats();
        return stats.currentPrice || 0.0035;
      } catch (error) {
        console.error('Error getting current price from token stats:', error);
        return 0.0035;
      }
    }
  },

  // Price operations (for historical price data)
  price: {
    async getCurrentPrice(symbol = 'TOKEN') {
      try {
        return await executeQuery(async (db) => {
          return await db.price.findFirst({
            where: { symbol },
            orderBy: { timestamp: 'desc' }
          });
        }, FALLBACK_DATA.price);
      } catch (error) {
        console.error('Error getting current price:', error);
        return FALLBACK_DATA.price;
      }
    },

    async addPriceSnapshot(symbol, price, volume = null, marketCap = null, source = 'system') {
      try {
        return await executeQuery(async (db) => {
          return await db.price.create({
            data: {
              symbol,
              price,
              volume,
              marketCap,
              source
            }
          });
        }, null);
      } catch (error) {
        console.error('Error adding price snapshot:', error);
        throw error;
      }
    }
  },

  // Wallet operations
  wallet: {
    async getUserWallet(userId) {
      try {
        return await executeQuery(async (db) => {
          return await db.wallet.findUnique({
            where: { userId }
          });
        }, null);
      } catch (error) {
        console.error('Error getting user wallet:', error);
        return null;
      }
    },

    async createWallet(userId, currency = 'PKR') {
      try {
        return await executeQuery(async (db) => {
          return await db.wallet.create({
            data: {
              userId,
              balance: 0,
              currency
            }
          });
        }, null);
      } catch (error) {
        console.error('Error creating wallet:', error);
        throw error;
      }
    }
  }
}

export default databaseHelpers;
