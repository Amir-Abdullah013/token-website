#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...');

// Create .env.local file
const envContent = `# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/token_website
DIRECT_URL=postgresql://postgres:password@localhost:5432/token_website

# Supabase Configuration (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here

# Development Mode
NODE_ENV=development
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('📝 Please update the database connection string with your actual database credentials');
  console.log('🔗 Example: postgresql://username:password@localhost:5432/database_name');
  console.log('🚀 After updating, run: npm run dev');
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  console.log('📝 Please create .env.local manually with your database connection string');
}

