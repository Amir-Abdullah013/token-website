import { databaseSetup } from './database-setup.js';

// Database setup script
async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Initialize the database
    await databaseSetup.initializeDatabase();
    
    console.log('✅ Database setup completed successfully!');
    console.log('📊 Collections created:');
    console.log('  - Wallets (with user permissions)');
    console.log('  - Transactions (with user permissions)');
    console.log('🔐 Security rules applied:');
    console.log('  - Users can only access their own data');
    console.log('  - Admins have full access');
    
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Export for use in other files
export { setupDatabase };

// Run setup if this file is executed directly
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setupDatabase().catch(console.error);
}







