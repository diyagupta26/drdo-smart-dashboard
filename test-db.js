import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = "postgresql://neondb_owner:npg_WAbsOY2KU0QR@ep-spring-lab-a2pkon2l.eu-central-1.aws.neon.tech/neondb?sslmode=require";

console.log('Testing database connection...');
console.log('DATABASE_URL:', DATABASE_URL ? 'Set' : 'Not set');

const pool = new Pool({ connectionString: DATABASE_URL });

try {
  const result = await pool.query('SELECT NOW()');
  console.log('Database connection successful!');
  console.log('Current time from DB:', result.rows[0]);
} catch (error) {
  console.error('Database connection failed:', error.message);
} finally {
  await pool.end();
}