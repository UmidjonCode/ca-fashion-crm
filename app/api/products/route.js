import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { rows } = await query('SELECT * FROM products ORDER BY id DESC');
  return NextResponse.json(rows);
}

export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const { name, sku, category, price, stock } = b;
  if (!name?.trim() || !sku?.trim() || !category?.trim()) {
    return NextResponse.json({ error: 'Name, SKU and category are required.' }, { status: 400 });
  }
  const { rows } = await query(
    'INSERT INTO products (name, sku, category, price, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name.trim(), sku.trim(), category.trim(), Number(price) || 0, Number(stock) || 0]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
