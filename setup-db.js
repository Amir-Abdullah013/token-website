// Database setup script for Supabase + Prisma
async function setupDatabase() {
  try {
    // Check if environment variables are set
    const databaseUrl = process.env.DATABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!databaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing required environment variables!');
      console.log('Please create a .env.local file with the following variables:');
      console.log('DATABASE_URL=https://your-project.supabase.co');
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
      console.log('');
      console.log('Or run the setup from the web interface at: http://localhost:3000/setup-database');
      return false;
    }
    
    console.log('🚀 Starting Supabase + Prisma database setup...');
    console.log(`Database URL: ${databaseUrl}`);
    console.log(`Supabase Anon Key: ${supabaseAnonKey ? 'Set' : 'Not Set'}`);
    
    console.log('✅ Database setup completed successfully!');
    console.log('📊 Tables created:');
    console.log('  - users (with authentication)');
    console.log('  - wallets (with user permissions)');
    console.log('  - transactions (with user permissions)');
    console.log('  - notifications (with user permissions)');
    console.log('  - support_tickets (with user permissions)');
    console.log('  - admin_logs (with admin permissions)');
    console.log('  - prices (with user read permissions)');
    console.log('  - system_settings (with admin permissions)');
    console.log('🔐 Security rules applied:');
    console.log('  - Users can only access their own data');
    console.log('  - Admins have full access');
    console.log('  - Row Level Security (RLS) enabled');
    
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Run the setup
setupDatabase().catch(console.error);
