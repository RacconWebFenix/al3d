const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://al3d_user:al3d_password@127.0.0.1:5433/al3d_db?schema=public',
});

async function init() {
  console.log('Iniciando setup do banco de dados AL3D...');

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

  console.log('Tabela transactions verificada/criada com sucesso.');

  // Checar se já existem registros
  const countRes = await pool.query('SELECT COUNT(*) FROM transactions');
  if (parseInt(countRes.rows[0].count, 10) === 0) {
    console.log('Populando dados iniciais de Setembro da AL3D...');
    const initialData = [
      { type: 'INCOME', amount: 120.00, date: '2024-09-06', description: '3 troféus Banespinha', is_partial: false },
      { type: 'INCOME', amount: 400.00, date: '2024-09-11', description: '100 chaveiros 4 rodas', is_partial: false },
      { type: 'INCOME', amount: 60.00, date: '2024-09-14', description: 'glock do luis', is_partial: false },
      { type: 'INCOME', amount: 73.13, date: '2024-09-14', description: '1/2 chaveiros yudi', is_partial: true, partial_note: '50% pago' },
      { type: 'EXPENSE', amount: 44.00, date: '2024-09-13', description: 'chaveiros com elo', is_partial: false }
    ];

    for (const item of initialData) {
      await pool.query(
        `INSERT INTO transactions (type, amount, date, description, is_partial, partial_note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.type, item.amount, item.date, item.description, item.is_partial, item.partial_note || null]
      );
    }
    console.log('Dados de Setembro inseridos com sucesso!');
  } else {
    console.log(`Banco já contém ${countRes.rows[0].count} registros.`);
  }

  await pool.end();
}

init().catch((err) => {
  console.error('Erro na inicialização:', err);
  process.exit(1);
});
