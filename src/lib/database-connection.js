import { PrismaClient } from '@prisma/client'

// Connection pool manager to prevent multiple Prisma instances
class DatabaseConnectionManager {
  constructor() {
    this.prisma = null
    this.isConnected = false
  }

  async getConnection() {
    if (this.prisma && this.isConnected) {
      return this.prisma
    }

    try {
      // Disconnect existing connection if any
      if (this.prisma) {
        await this.prisma.$disconnect()
      }

      // Create new connection
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        errorFormat: 'pretty',
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      })

      await this.prisma.$connect()
      this.isConnected = true
      
      console.log('✅ Database connection established')
      return this.prisma
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      this.isConnected = false
      throw error
    }
  }

  async disconnect() {
    if (this.prisma && this.isConnected) {
      try {
        await this.prisma.$disconnect()
        this.isConnected = false
        console.log('🔌 Database connection closed')
      } catch (error) {
        console.warn('Warning: Error disconnecting database:', error)
      }
    }
  }

  async retryOperation(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prisma = await this.getConnection()
        return await operation(prisma)
      } catch (error) {
        if (error.message?.includes('prepared statement') && attempt < maxRetries) {
          console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`)
          this.isConnected = false // Force reconnection
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          continue
        }
        throw error
      }
    }
  }
}

// Create singleton instance
const dbManager = new DatabaseConnectionManager()

// Export the connection manager
export { dbManager }

// Export a function to get the current Prisma instance
export async function getPrisma() {
  return await dbManager.getConnection()
}

// Export retry operation function
export async function retryDatabaseOperation(operation, maxRetries = 3) {
  return await dbManager.retryOperation(operation, maxRetries)
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await dbManager.disconnect()
  })
  
  process.on('SIGINT', async () => {
    await dbManager.disconnect()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await dbManager.disconnect()
    process.exit(0)
  })
}
