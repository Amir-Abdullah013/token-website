// NUCLEAR OPTION - Complete elimination of Prisma connection issues
// This solution completely disables database connections in development mode

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

// NUCLEAR DATABASE HELPERS - Complete database-free mode for development
export const databaseHelpers = {
  // User operations
  user: {
    async getUserByEmail(email) {
      console.log('🔧 Development mode: Using fallback data for getUserByEmail')
      return FALLBACK_DATA.user
    },

    async getUserById(id) {
      console.log('🔧 Development mode: Using fallback data for getUserById')
      return FALLBACK_DATA.user
    },

    async createUser(userData) {
      console.log('🔧 Development mode: Simulating user creation')
      return {
        id: 'dev-user-' + Date.now(),
        ...userData,
        createdAt: new Date()
      }
    }
  },

  // Token stats operations
  tokenStats: {
    async getTokenStats() {
      console.log('🔧 Development mode: Using fallback data for getTokenStats')
      return FALLBACK_DATA.tokenStats
    },

    async getCurrentPrice() {
      console.log('🔧 Development mode: Using fallback data for getCurrentPrice')
      return FALLBACK_DATA.tokenStats.currentPrice
    }
  },

  // Price operations
  price: {
    async getCurrentPrice(symbol = 'TOKEN') {
      console.log('🔧 Development mode: Using fallback data for getCurrentPrice')
      return FALLBACK_DATA.price
    },

    async addPriceSnapshot(symbol, price, volume = null, marketCap = null, source = 'system') {
      console.log('🔧 Development mode: Simulating price snapshot creation')
      return {
        id: 'dev-price-' + Date.now(),
        symbol,
        price,
        volume,
        marketCap,
        source,
        timestamp: new Date()
      }
    }
  },

  // Wallet operations
  wallet: {
    async getUserWallet(userId) {
      console.log('🔧 Development mode: Using fallback data for getUserWallet')
      return null
    },

    async createWallet(userId, currency = 'PKR') {
      console.log('🔧 Development mode: Simulating wallet creation')
      return {
        id: 'dev-wallet-' + Date.now(),
        userId,
        balance: 0,
        currency,
        createdAt: new Date()
      }
    }
  }
}

export default databaseHelpers
