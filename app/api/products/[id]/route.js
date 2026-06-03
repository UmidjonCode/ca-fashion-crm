import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const id = Number(params.id);
  const b = await request.json().catch(() => ({}));
  const { name, sku, category, price, stock } = b;
  if (!name?.trim() || !sku?.trim() || !category?.trim()) {
    return NextResponse.json({ error: 'Name, SKU and category are required.' }, { status: 400 });
  }
  const { rows, rowCount } = await query(
    'UPDATE products SET name = $1, sku = $2, category = $3, price = $4, stock = $5 WHERE id = $6 RETURNING *',
    [name.trim(), sku.trim(), category.trim(), Number(price) || 0, Number(stock) || 0, id]
  );
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const id = Number(params.id);
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id]);
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
