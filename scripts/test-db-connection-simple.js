#!/usr/bin/env node

/**
 * Simple database connection test
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config({ path: '.env.local' });

console.log('🧪 Testing Database Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? '✅ Set' : '❌ Not set');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Parse DATABASE_URL
const parseDatabaseUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port) || 5432,
      database: urlObj.pathname.slice(1),
      user: urlObj.username,
      password: urlObj.password,
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error.message);
    return null;
  }
};

async function testConnection() {
  console.log('\n🔗 Testing database connection...');
  
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  if (!dbConfig) {
    console.error('❌ Failed to parse DATABASE_URL');
    return false;
  }

  console.log('Database Config:');
  console.log('  Host:', dbConfig.host);
  console.log('  Port:', dbConfig.port);
  console.log('  Database:', dbConfig.database);
  console.log('  User:', dbConfig.user);

  const pool = new Pool({
    ...dbConfig,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection successful!');
    console.log('  Current time:', result.rows[0].now);
    
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('  Error code:', error.code);
    console.error('  Error details:', error.detail);
    
    await pool.end();
    return false;
  }
}

// Run the test
testConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Database connection test passed!');
      console.log('   Deposit functionality should work correctly.');
    } else {
      console.log('\n❌ Database connection test failed!');
      console.log('   Please check your DATABASE_URL configuration.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
