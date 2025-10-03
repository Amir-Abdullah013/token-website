#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file already exists');
  console.log('📄 Contents:');
  console.log(fs.readFileSync(envPath, 'utf8'));
} else {
  console.log('❌ .env.local file not found');
  console.log('');
  console.log('Creating .env.local file with template values...');
  
  const envTemplate = `# Supabase Configuration (for client-side)
DATABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration (for Prisma - server-side)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id`;

  try {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ .env.local file created successfully!');
    console.log('');
    console.log('⚠️  IMPORTANT: Please update the following values in .env.local:');
    console.log('   - DATABASE_URL: Replace with your actual Supabase project URL');
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Replace with your actual Supabase anon key');
    console.log('   - DATABASE_URL: Replace with your actual database connection string');
    console.log('   - NEXT_PUBLIC_GOOGLE_CLIENT_ID: Your Google OAuth Client ID');
    console.log('');
    console.log('📖 For detailed instructions, see: SUPABASE_SETUP.md');
  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
  }
}

console.log('');
console.log('🚀 Next steps:');
console.log('1. Update .env.local with your actual values');
console.log('2. Run: npm run db:generate');
console.log('3. Run: npm run db:push');
console.log('4. Run: npm run db:seed (optional)');
console.log('5. Run: npm run dev');
console.log('');
console.log('📚 For more help, see: SUPABASE_SETUP.md');




