import { Pool } from 'pg';

let poolInstance: Pool | null = null;
let isTableChecked = false;

function getPool(): Pool {
  if (!poolInstance) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.DATABASE_URL_POSTGRES_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
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

    // Seed de pedidos iniciais se a tabela estiver vazia
    const countRes = await pool.query('SELECT COUNT(*) FROM orders');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      const initialOrders = [
        { client: 'Banespinha', desc: '3x Troféus Torneio', stage: 'COTACAO', val: 400, paid: 200, partial: true, days: 5 },
        { client: 'Banespinha', desc: '3x Troféus Torneio', stage: 'COTACAO', val: 400, paid: 400, partial: false, days: 7 },
        { client: 'Luis Glock', desc: '100x Chaveiros Logo', stage: 'MODELANDO', val: 400, paid: 200, partial: true, days: 3 },
        { client: 'Luis Glock', desc: '1x Flallus, Taria', stage: 'MODELANDO', val: 200, paid: 200, partial: false, days: 4 },
        { client: 'Yudi Chaveiros', desc: '100x Chaveiros Logo', stage: 'IMPRIMINDO', val: 400, paid: 200, partial: true, days: 2 },
        { client: 'Banespinha', desc: '100x Chaveiros Logo', stage: 'IMPRIMINDO', val: 400, paid: 400, partial: false, days: 3 },
        { client: 'Yudi Chaveiros', desc: '100x Chaveiros Logo', stage: 'PAGAMENTO', val: 400, paid: 400, partial: false, days: 1 },
        { client: 'Yudi Chaveiros', desc: '100x Chaveiros Logo', stage: 'PAGAMENTO', val: 250, paid: 250, partial: false, days: 2 },
        { client: 'Luis Glock', desc: '3x Troféus Torneio', stage: 'ENTREGUE', val: 400, paid: 400, partial: false, days: -1 },
        { client: 'Luis Glock', desc: '10x Troféus Torneio', stage: 'ENTREGUE', val: 400, paid: 400, partial: false, days: -2 }
      ];

      for (const ord of initialOrders) {
        const d = new Date();
        d.setDate(d.getDate() + ord.days);
        const deliveryStr = d.toISOString().split('T')[0];

        await pool.query(`
          INSERT INTO orders (client_name, description, stage, total_value, paid_amount, is_partial_paid, delivery_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [ord.client, ord.desc, ord.stage, ord.val, ord.paid, ord.partial, deliveryStr]);
      }
    }

    isTableChecked = true;
  } catch (err) {
    console.error('Falha ao verificar/criar tabelas transactions/orders:', err);
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
