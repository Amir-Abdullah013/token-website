require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createOrdersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating Orders table for limit trading...\n');
    
    // Create OrderType enum
    console.log('Creating OrderType enum...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "OrderType" AS ENUM ('BUY', 'SELL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ OrderType enum ready');
    
    // Create PriceType enum
    console.log('Creating PriceType enum...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "PriceType" AS ENUM ('MARKET', 'LIMIT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ PriceType enum ready');
    
    // Create OrderStatus enum
    console.log('Creating OrderStatus enum...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PARTIAL', 'FILLED', 'CANCELED', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ OrderStatus enum ready');
    
    // Create orders table
    console.log('\nCreating orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "orderType" "OrderType" NOT NULL,
        "priceType" "PriceType" NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        "tokenAmount" DECIMAL(15, 2),
        "limitPrice" DECIMAL(15, 8),
        status "OrderStatus" DEFAULT 'PENDING',
        "filledAmount" DECIMAL(15, 2) DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "executedAt" TIMESTAMP WITH TIME ZONE,
        "canceledAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT fk_orders_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Orders table created');
    
    // Create indexes for better query performance
    console.log('\nCreating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders("userId");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_price_type ON orders("priceType");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_limit_price ON orders("limitPrice") WHERE "priceType" = 'LIMIT' AND status = 'PENDING';
    `);
    console.log('✅ Indexes created');
    
    // Check if table was created successfully
    const checkTable = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'orders'
    `);
    
    if (checkTable.rows[0].count > 0) {
      console.log('\n✅ Orders table created successfully!');
      console.log('📊 Trading system is ready for limit orders!');
    } else {
      console.log('\n❌ Failed to create orders table');
    }
    
  } catch (error) {
    console.error('❌ Error creating orders table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createOrdersTable().catch(console.error);


