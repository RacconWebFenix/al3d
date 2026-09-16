import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://al3d_user:al3d_password@127.0.0.1:5433/al3d_db?schema=public',
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  return res;
}

export default pool;
