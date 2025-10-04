#!/usr/bin/env node

/**
 * OAuth Environment Setup Script
 * This script helps you set up the required environment variables for OAuth functionality
 */

const fs = require('fs');
const path = require('path');

const envExample = `# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth Configuration (optional)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# NextAuth Configuration (optional)
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_NEXTAUTH_SECRET=your-nextauth-secret`;

const envLocalPath = path.join(process.cwd(), '.env.local');

console.log('🔧 OAuth Environment Setup Script');
console.log('=====================================\n');

// Check if .env.local exists
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file already exists');
  console.log('📝 Please ensure the following variables are set:\n');
  console.log(envExample);
} else {
  console.log('📝 Creating .env.local file...');
  fs.writeFileSync(envLocalPath, envExample);
  console.log('✅ .env.local file created successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Edit .env.local and replace the placeholder values with your actual credentials');
  console.log('2. Get your Supabase credentials from: https://supabase.com/dashboard');
  console.log('3. Get your Google OAuth credentials from: https://console.cloud.google.com/');
  console.log('4. Restart your development server: npm run dev');
}

console.log('\n🔍 Required Environment Variables:');
console.log('=====================================');
console.log('DATABASE_URL - Your database connection string');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID - Your Google OAuth client ID');
console.log('GOOGLE_CLIENT_SECRET - Your Google OAuth client secret');
console.log('NEXT_PUBLIC_GITHUB_CLIENT_ID - Your GitHub OAuth client ID (optional)');
console.log('GITHUB_CLIENT_SECRET - Your GitHub OAuth client secret (optional)');
console.log('\n📚 For detailed setup instructions, see: ENVIRONMENT_SETUP.md');
