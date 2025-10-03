// Database loader utility for Vercel-compatible API routes
let databaseHelpers = null;
let prisma = null;

export const loadDatabaseHelpers = async () => {
  if (databaseHelpers) return databaseHelpers;
  
  try {
    const dbModule = await import('./database.js');
    databaseHelpers = dbModule.databaseHelpers;
    return databaseHelpers;
  } catch (error) {
    console.warn('Database helpers not available:', error.message);
    return null;
  }
};

export const loadPrisma = async () => {
  if (prisma) return prisma;
  
  try {
    const prismaModule = await import('./prisma.js');
    prisma = prismaModule.prisma;
    return prisma;
  } catch (error) {
    console.warn('Prisma not available:', error.message);
    return null;
  }
};

// Mock data for when database is not available
export const getMockData = {
  transactions: () => ({
    transactions: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    }
  }),
  
  notifications: () => ({
    notifications: [],
    unreadCount: 0
  }),
  
  wallet: () => ({
    balance: 0,
    currency: 'PKR',
    lastUpdated: new Date().toISOString()
  })
};
