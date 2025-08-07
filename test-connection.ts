import { Pool } from '@neondatabase/serverless';

async function testConnection() {
  const pool = new Pool({ 
    connectionString: "postgresql://neondb_owner:npg_WAbsOY2KU0QR@ep-spring-lab-a2pkon2l.eu-central-1.aws.neon.tech/neondb?sslmode=require" 
  });

  try {
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully!');
    console.log('⏰ Current time:', result.rows[0].current_time);
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📊 Existing tables:', tables.rows.map(r => r.table_name));
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection();