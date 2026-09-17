import { NextResponse } from 'next/server';
import pool, { QueryParam } from '@/lib/db';

interface TransactionDbRow {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: string | number;
  date: string | Date;
  description: string;
  is_partial: boolean;
  partial_note: string | null;
  total_value: string | number | null;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '', 10);
    const year = parseInt(searchParams.get('year') || '', 10);

    let queryText = "SELECT id, type, amount, TO_CHAR(date, 'YYYY-MM-DD') as date, description, is_partial, partial_note, total_value, created_at FROM transactions ORDER BY date DESC, id DESC";
    let queryParams: QueryParam[] = [];

    if (!isNaN(month) && !isNaN(year)) {
      queryText = `
        SELECT id, type, amount, TO_CHAR(date, 'YYYY-MM-DD') as date, description, is_partial, partial_note, total_value, created_at 
        FROM transactions 
        WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
        ORDER BY date DESC, id DESC
      `;
      queryParams = [month, year];
    }

    const result = await pool.query(queryText, queryParams);
    const transactions = (result.rows as TransactionDbRow[]).map((row) => ({
      ...row,
      amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount),
      total_value: row.total_value ? (typeof row.total_value === 'number' ? row.total_value : parseFloat(row.total_value)) : null,
      date: String(row.date),
    }));

    // Calcular totais
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.type === 'INCOME') {
        totalIncome += t.amount;
      } else if (t.type === 'EXPENSE') {
        totalExpense += t.amount;
      }
    }

    const netTotal = totalIncome - totalExpense;

    return NextResponse.json({
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        netTotal,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao buscar transações';
    console.error('Erro ao buscar transações:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, amount, date, description, is_partial, partial_note, total_value } = body;

    if (!type || !amount || !date || !description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, valor, data e descrição' },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO transactions (type, amount, date, description, is_partial, partial_note, total_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, type, amount, TO_CHAR(date, 'YYYY-MM-DD') as date, description, is_partial, partial_note, total_value, created_at`,
      [
        type,
        parsedAmount,
        date,
        description.trim(),
        Boolean(is_partial),
        partial_note ? partial_note.trim() : null,
        total_value ? parseFloat(total_value) : null,
      ]
    );

    const created = result.rows[0] as TransactionDbRow;
    return NextResponse.json({
      ...created,
      amount: typeof created.amount === 'number' ? created.amount : parseFloat(created.amount),
      date: String(created.date),
    }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao criar transação';
    console.error('Erro ao criar transação:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao excluir transação';
    console.error('Erro ao excluir transação:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
