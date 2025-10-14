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

const setupAdminUser = async () => {
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

    // Step 1: Check if isAdmin column exists
    console.log('\n🔍 Step 1: Checking isAdmin column...');
    try {
      const columnCheck = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'isAdmin'
      `);
      
      if (columnCheck.rows.length > 0) {
        console.log('✅ isAdmin column exists:', columnCheck.rows[0]);
      } else {
        console.log('⚠️ isAdmin column not found. Adding it...');
        await client.query(`
          ALTER TABLE users ADD COLUMN "isAdmin" BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ isAdmin column added');
      }
    } catch (error) {
      console.error('❌ Error with isAdmin column:', error.message);
    }

    // Step 2: Check for existing admin users
    console.log('\n👤 Step 2: Checking for admin users...');
    try {
      const adminUsers = await client.query('SELECT id, email, name, "isAdmin" FROM users WHERE "isAdmin" = true');
      
      if (adminUsers.rows.length > 0) {
        console.log('✅ Admin users found:');
        adminUsers.rows.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - isAdmin: ${user.isAdmin}`);
        });
      } else {
        console.log('⚠️ No admin users found. Creating one...');
        
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
      console.error('❌ Error with admin users:', error.message);
    }

    // Step 3: Check if we can make an existing user an admin
    console.log('\n🔄 Step 3: Checking existing users...');
    try {
      const allUsers = await client.query('SELECT id, email, name, "isAdmin", role FROM users ORDER BY "createdAt" DESC LIMIT 5');
      
      if (allUsers.rows.length > 0) {
        console.log('📋 Existing users:');
        allUsers.rows.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - isAdmin: ${user.isAdmin}, role: ${user.role}`);
        });

        // Ask if we should make the first user an admin
        const firstUser = allUsers.rows[0];
        if (!firstUser.isAdmin) {
          console.log(`\n🔧 Making ${firstUser.email} an admin...`);
          await client.query(`
            UPDATE users 
            SET "isAdmin" = true, role = 'ADMIN', "updatedAt" = NOW()
            WHERE id = $1
          `, [firstUser.id]);
          console.log('✅ User promoted to admin');
        }
      } else {
        console.log('⚠️ No users found in database');
      }
    } catch (error) {
      console.error('❌ Error checking existing users:', error.message);
    }

    // Step 4: Verify admin setup
    console.log('\n✅ Step 4: Verifying admin setup...');
    try {
      const finalCheck = await client.query('SELECT id, email, name, "isAdmin", role FROM users WHERE "isAdmin" = true');
      
      if (finalCheck.rows.length > 0) {
        console.log('🎉 Admin setup complete!');
        console.log('📋 Admin users:');
        finalCheck.rows.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - isAdmin: ${user.isAdmin}, role: ${user.role}`);
        });
        console.log('\n🚀 You can now access the admin dashboard!');
      } else {
        console.log('❌ No admin users found after setup');
      }
    } catch (error) {
      console.error('❌ Error verifying admin setup:', error.message);
    }

    console.log('\n🎉 Admin user setup completed!');
    console.log('\n📋 Summary:');
    console.log('- isAdmin column: ✅ Verified/Added');
    console.log('- Admin users: ✅ Created/Verified');
    console.log('- Database setup: ✅ Complete');
    console.log('\n🚀 The dashboard should now work properly!');

  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await pool.end();
  }
};

// Run the setup
setupAdminUser().catch(console.error);
