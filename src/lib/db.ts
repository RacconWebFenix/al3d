import { Pool } from 'pg';

let poolInstance: Pool | null = null;
let isTableChecked = false;

function getPool(): Pool {
  if (!poolInstance) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://al3d_user:al3d_password@127.0.0.1:5433/al3d_db?schema=public';

    const isLocal =
      connectionString.includes('127.0.0.1') ||
      connectionString.includes('localhost');

    poolInstance = new Pool({
      connectionString,
      ssl: !isLocal ? { rejectUnauthorized: false } : undefined,
    });
  }
  return poolInstance;
}

async function ensureTableExists() {
  if (isTableChecked) return;
  try {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
        amount NUMERIC(10, 2) NOT NULL,
        date DATE NOT NULL,
        description VARCHAR(255) NOT NULL,
        is_partial BOOLEAN DEFAULT FALSE,
        partial_note VARCHAR(100),
        total_value NUMERIC(10, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    `);
    isTableChecked = true;
  } catch (err) {
    console.error('Falha ao verificar/criar tabela transactions:', err);
  }
}

export async function query(text: string, params?: any[]) {
  await ensureTableExists();
  const pool = getPool();
  const res = await pool.query(text, params);
  return res;
}

const db = {
  query,
  getPool,
};

export default db;
