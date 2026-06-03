import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered'];

export async function GET() {
  const { rows } = await query(
    `SELECT o.*, c.company AS customer_company, c.name AS customer_name
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     ORDER BY o.created_at DESC, o.id DESC`
  );
  return NextResponse.json(rows);
}

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const { order_number, customer_id, status, total, items_count } = b;
  if (!order_number?.trim()) {
    return NextResponse.json({ error: 'Order number is required.' }, { status: 400 });
  }
  if (status && !STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }
  const { rows } = await query(
    'INSERT INTO orders (order_number, customer_id, status, total, items_count) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [order_number.trim(), customer_id || null, status || 'pending', Number(total) || 0, Number(items_count) || 0]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
