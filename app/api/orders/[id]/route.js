import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered'];

export async function PUT(request, { params }) {
  const id = Number(params.id);
  const b = await request.json().catch(() => ({}));
  const { order_number, customer_id, status, total, items_count } = b;
  if (!order_number?.trim()) {
    return NextResponse.json({ error: 'Order number is required.' }, { status: 400 });
  }
  if (status && !STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }
  const { rows, rowCount } = await query(
    'UPDATE orders SET order_number = $1, customer_id = $2, status = $3, total = $4, items_count = $5 WHERE id = $6 RETURNING *',
    [order_number.trim(), customer_id || null, status || 'pending', Number(total) || 0, Number(items_count) || 0, id]
  );
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const id = Number(params.id);
  const { rowCount } = await query('DELETE FROM orders WHERE id = $1', [id]);
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
