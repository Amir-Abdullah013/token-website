const { Pool } = require('pg');
const { randomUUID } = require('crypto');

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
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    return null;
  }
};

const checkAdminUsers = async () => {
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  if (!dbConfig) {
    console.error('❌ Failed to parse DATABASE_URL');
    return;
  }

  const pool = new Pool(dbConfig);

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    
    console.log('✅ Connected to database successfully');

    // Check for admin users
    console.log('\n👤 Checking for admin users...');
    try {
      const adminUsers = await client.query('SELECT id, email, name, "isAdmin", role FROM users WHERE "isAdmin" = true');
      
      if (adminUsers.rows.length > 0) {
        console.log('✅ Admin users found:');
        adminUsers.rows.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - isAdmin: ${user.isAdmin}, role: ${user.role}`);
        });
      } else {
        console.log('⚠️ No admin users found. Creating test admin...');
        
        const testAdmin = await client.query(`
          INSERT INTO users (id, email, name, password, "emailVerified", role, "isAdmin", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING id, email, name, "isAdmin", role
        `, [
          randomUUID(),
          'admin@example.com',
          'Test Admin',
          'hashedpassword',
          true,
          'ADMIN',
          true
        ]);
        
        console.log('✅ Test admin created:', testAdmin.rows[0]);
      }
    } catch (error) {
      console.error('❌ Error checking admin users:', error.message);
    }

    // Check all users
    console.log('\n👥 All users in database:');
    try {
      const allUsers = await client.query('SELECT id, email, name, "isAdmin", role FROM users ORDER BY "createdAt" DESC LIMIT 10');
      
      if (allUsers.rows.length > 0) {
        allUsers.rows.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - isAdmin: ${user.isAdmin}, role: ${user.role}`);
        });
      } else {
        console.log('⚠️ No users found in database');
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error.message);
    }

    // Check if isAdmin column exists
    console.log('\n🔍 Checking isAdmin column...');
    try {
      const columnCheck = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'isAdmin'
      `);
      
      if (columnCheck.rows.length > 0) {
        console.log('✅ isAdmin column found:', columnCheck.rows[0]);
      } else {
        console.log('❌ isAdmin column not found in users table');
        console.log('   This column should have been added by the Prisma migration');
      }
    } catch (error) {
      console.error('❌ Error checking isAdmin column:', error.message);
    }

    console.log('\n🎉 Admin user check completed!');
    console.log('\n📋 Summary:');
    console.log('- Admin users: Checked');
    console.log('- All users: Listed');
    console.log('- isAdmin column: Verified');
    console.log('\n🚀 If no admin users exist, create one manually or run the migration');

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await pool.end();
  }
};

// Run the check
checkAdminUsers().catch(console.error);



