import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Create a singleton Prisma client to prevent multiple instances
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Add connection pooling configuration
  __internal: {
    engine: {
      binaryTargets: ['native']
    }
  }
})

// Ensure we only have one instance globally
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Add connection cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.warn('Error disconnecting Prisma:', error)
    }
  })
  
  process.on('SIGINT', async () => {
    try {
      await prisma.$disconnect()
      process.exit(0)
    } catch (error) {
      console.warn('Error disconnecting Prisma on SIGINT:', error)
      process.exit(1)
    }
  })
  
  process.on('SIGTERM', async () => {
    try {
      await prisma.$disconnect()
      process.exit(0)
    } catch (error) {
      console.warn('Error disconnecting Prisma on SIGTERM:', error)
      process.exit(1)
    }
  })
}

export default prisma










