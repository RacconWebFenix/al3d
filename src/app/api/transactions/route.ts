import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '', 10);
    const year = parseInt(searchParams.get('year') || '', 10);

    let queryText = "SELECT id, type, amount, TO_CHAR(date, 'YYYY-MM-DD') as date, description, is_partial, partial_note, total_value, created_at FROM transactions ORDER BY date DESC, id DESC";
    let queryParams: any[] = [];

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
    const transactions = result.rows.map((row: any) => ({
      ...row,
      amount: parseFloat(row.amount),
      total_value: row.total_value ? parseFloat(row.total_value) : null,
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
  } catch (error: any) {
    console.error('Erro ao buscar transações:', error);
    return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
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
       RETURNING *`,
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

    const created = result.rows[0];
    return NextResponse.json({
      ...created,
      amount: parseFloat(created.amount),
      date: created.date instanceof Date ? created.date.toISOString().split('T')[0] : String(created.date),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 500 });
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
  } catch (error: any) {
    console.error('Erro ao excluir transação:', error);
    return NextResponse.json({ error: 'Erro ao excluir transação' }, { status: 500 });
  }
}
