import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import pool, { QueryParam } from '@/lib/db';
import { orderPatchSchema } from '@/lib/orderSchemas';

interface OrderDbRow {
  id: number;
  client_name: string;
  description: string;
  stage: string;
  total_value: string | number;
  paid_amount: string | number;
  is_partial_paid: boolean;
  delivery_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const search = searchParams.get('q');

    let queryText = `
      SELECT id, client_name, description, stage, total_value, paid_amount, 
             is_partial_paid, TO_CHAR(delivery_date, 'YYYY-MM-DD') as delivery_date, 
             notes, created_at, updated_at
      FROM orders
    `;
    const conditions: string[] = [];
    const params: QueryParam[] = [];

    if (stage) {
      params.push(stage);
      conditions.push(`stage = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(client_name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += ` ORDER BY delivery_date ASC, id DESC`;

    const result = await pool.query(queryText, params);
    const orders = (result.rows as OrderDbRow[]).map((row) => ({
      ...row,
      total_value: typeof row.total_value === 'number' ? row.total_value : parseFloat(row.total_value) || 0,
      paid_amount: typeof row.paid_amount === 'number' ? row.paid_amount : parseFloat(row.paid_amount) || 0,
    }));

    return NextResponse.json({ orders });
  } catch (error: unknown) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedidos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { client_name, description, stage, total_value, paid_amount, is_partial_paid, delivery_date, notes } = body;

    if (!client_name || !description || !delivery_date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: Nome do cliente, descrição e data de entrega.' },
        { status: 400 }
      );
    }

    const numTotal = parseFloat(total_value) || 0;
    const numPaid = parseFloat(paid_amount) || 0;

    const result = await pool.query(
      `INSERT INTO orders (client_name, description, stage, total_value, paid_amount, is_partial_paid, delivery_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, client_name, description, stage, total_value, paid_amount, is_partial_paid, TO_CHAR(delivery_date, 'YYYY-MM-DD') as delivery_date, notes, created_at, updated_at`,
      [
        client_name.trim(),
        description.trim(),
        stage || 'COTACAO',
        numTotal,
        numPaid,
        Boolean(is_partial_paid),
        delivery_date,
        notes ? notes.trim() : null,
      ]
    );

    const created = result.rows[0] as OrderDbRow;
    return NextResponse.json({
      ...created,
      total_value: typeof created.total_value === 'number' ? created.total_value : parseFloat(created.total_value),
      paid_amount: typeof created.paid_amount === 'number' ? created.paid_amount : parseFloat(created.paid_amount),
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: 'Erro ao criar pedido.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const parsed = orderPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const { id, stage, paid_amount, is_partial_paid, notes, delivery_date, description, client_name, total_value } = parsed.data;

    const updates: string[] = [];
    const params: QueryParam[] = [];

    if (stage !== undefined) {
      params.push(stage);
      updates.push(`stage = $${params.length}`);
    }
    if (paid_amount !== undefined) {
      params.push(Number(paid_amount));
      updates.push(`paid_amount = $${params.length}`);
    }
    if (is_partial_paid !== undefined) {
      params.push(Boolean(is_partial_paid));
      updates.push(`is_partial_paid = $${params.length}`);
    }
    if (notes !== undefined) {
      const safeNotes = notes === null ? null : notes.trim();
      params.push(safeNotes as QueryParam);
      updates.push(`notes = $${params.length}`);
    }
    if (delivery_date !== undefined) {
      params.push(delivery_date);
      updates.push(`delivery_date = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (client_name !== undefined) {
      params.push(client_name.trim());
      updates.push(`client_name = $${params.length}`);
    }
    if (total_value !== undefined) {
      params.push(Number(total_value));
      updates.push(`total_value = $${params.length}`);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const queryText = `
      UPDATE orders 
      SET ${updates.join(', ')} 
      WHERE id = $${params.length}
      RETURNING id, client_name, description, stage, total_value, paid_amount, is_partial_paid, TO_CHAR(delivery_date, 'YYYY-MM-DD') as delivery_date, notes, created_at, updated_at
    `;

    const result = await pool.query(queryText, params);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const updated = result.rows[0] as OrderDbRow;
    return NextResponse.json({
      ...updated,
      total_value: typeof updated.total_value === 'number' ? updated.total_value : parseFloat(updated.total_value),
      paid_amount: typeof updated.paid_amount === 'number' ? updated.paid_amount : parseFloat(updated.paid_amount),
    });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json({ error: 'Erro ao atualizar pedido.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requireSession(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Erro ao excluir pedido:', error);
    return NextResponse.json({ error: 'Erro ao excluir pedido.' }, { status: 500 });
  }
}
