#!/usr/bin/env node

/**
 * Test database connection
 */

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Ensure your database is accessible');
    console.log('3. Check if your database server is running');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();




