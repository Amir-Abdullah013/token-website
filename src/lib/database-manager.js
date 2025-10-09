// Production-ready database connection manager
import { PrismaClient } from '@prisma/client'

// Global connection manager
class DatabaseManager {
  constructor() {
    this.connection = null
    this.isConnected = false
    this.connectionPromise = null
  }

  async getConnection() {
    // If already connected, return existing connection
    if (this.isConnected && this.connection) {
      return this.connection
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return await this.connectionPromise
    }

    // Create new connection
    this.connectionPromise = this.createConnection()
    return await this.connectionPromise
  }

  async createConnection() {
    try {
      // Disconnect existing connection if any
      if (this.connection) {
        try {
          await this.connection.$disconnect()
        } catch (error) {
          console.warn('Warning: Error disconnecting existing connection:', error.message)
        }
      }

      // Create new Prisma client with optimized settings
      this.connection = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        errorFormat: 'pretty',
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })

      // Connect to database
      await this.connection.$connect()
      this.isConnected = true
      
      console.log('✅ Database connection established')
      return this.connection

    } catch (error) {
      console.error('❌ Database connection failed:', error)
      this.isConnected = false
      this.connectionPromise = null
      throw error
    }
  }

  async disconnect() {
    if (this.connection && this.isConnected) {
      try {
        await this.connection.$disconnect()
        this.isConnected = false
        this.connection = null
        this.connectionPromise = null
        console.log('🔌 Database connection closed')
      } catch (error) {
        console.warn('Warning: Error disconnecting database:', error.message)
      }
    }
  }

  async executeQuery(operation, fallbackData = null) {
    try {
      const connection = await this.getConnection()
      return await operation(connection)
    } catch (error) {
      console.error('Database query failed:', error)
      
      // Return fallback data if provided
      if (fallbackData) {
        console.warn('Using fallback data due to database error')
        return fallbackData
      }
      
      throw error
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseManager()

// Export the database manager
export { dbManager }

// Export convenience functions
export async function getDatabase() {
  return await dbManager.getConnection()
}

export async function executeQuery(operation, fallbackData = null) {
  return await dbManager.executeQuery(operation, fallbackData)
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  const cleanup = async () => {
    await dbManager.disconnect()
  }

  process.on('beforeExit', cleanup)
  process.on('SIGINT', async () => {
    await cleanup()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await cleanup()
    process.exit(0)
  })
}
