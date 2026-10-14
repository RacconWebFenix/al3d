import { Pool } from 'pg';

let poolInstance: Pool | null = null;
let isTableChecked = false;

function getPool(): Pool {
  if (!poolInstance) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.DATABASE_URL_POSTGRES_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL não definida');
    }

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
    
    // Tabela de Transações Financeiras (Fluxo de Caixa)
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

    // Tabela de Pedidos e Pipeline de Produção 3D
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        stage VARCHAR(20) NOT NULL DEFAULT 'COTACAO',
        total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
        paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        is_partial_paid BOOLEAN DEFAULT FALSE,
        delivery_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_stage ON orders(stage);
      CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
    `);

    isTableChecked = true;
  } catch (err) {
    console.error('Falha ao verificar/criar tabelas transactions/orders:', err);
  }
}

export type QueryParam = string | number | boolean | null | undefined;

export async function query(text: string, params?: QueryParam[]) {
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
