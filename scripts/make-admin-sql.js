const { Pool } = require('pg');

// Create a direct PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function makeUserAdmin(email) {
  const client = await pool.connect();
  
  try {
    console.log(`🔧 Making user admin: ${email}`);
    
    // Check if user exists
    const checkResult = await client.query(
      'SELECT id, email, name, role FROM "User" WHERE email = $1',
      [email]
    );
    
    if (checkResult.rows.length === 0) {
      console.log(`❌ User with email ${email} not found in database`);
      console.log(`💡 Creating new user with ADMIN role...`);
      
      // Create new user with ADMIN role
      const insertResult = await client.query(
        'INSERT INTO "User" (id, email, name, role, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
          `user_${Date.now()}`, // Simple ID generation
          email,
          email.split('@')[0], // Use email prefix as name
          'ADMIN',
          true,
          new Date(),
          new Date()
        ]
      );
      
      console.log(`✅ New admin user created:`);
      console.log(`   Email: ${insertResult.rows[0].email}`);
      console.log(`   Name: ${insertResult.rows[0].name}`);
      console.log(`   Role: ${insertResult.rows[0].role}`);
      console.log(`   ID: ${insertResult.rows[0].id}`);
      
    } else {
      const user = checkResult.rows[0];
      console.log(`📋 Current user info:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Current Role: ${user.role}`);
      
      // Update user to ADMIN
      const updateResult = await client.query(
        'UPDATE "User" SET role = $1, "updatedAt" = $2 WHERE email = $3 RETURNING *',
        ['ADMIN', new Date(), email]
      );
      
      console.log(`✅ User role updated to ADMIN!`);
      console.log(`   Email: ${updateResult.rows[0].email}`);
      console.log(`   New Role: ${updateResult.rows[0].role}`);
    }
    
    console.log(`\n🎉 SUCCESS! User ${email} now has ADMIN access`);
    console.log(`🌐 You can now access: http://localhost:3000/admin/dashboard`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/make-admin-sql.js <email>');
  console.log('Example: node scripts/make-admin-sql.js admin@example.com');
  console.log('Example: node scripts/make-admin-sql.js your-email@gmail.com');
  process.exit(1);
}

makeUserAdmin(email);







