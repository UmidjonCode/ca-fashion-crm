import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const id = Number(params.id);
  const body = await request.json().catch(() => ({}));
  const { name, email, phone, company, address } = body;
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  const { rows, rowCount } = await query(
    'UPDATE customers SET name = $1, email = $2, phone = $3, company = $4, address = $5 WHERE id = $6 RETURNING *',
    [name.trim(), email.trim(), phone?.trim() || null, company?.trim() || null, address?.trim() || null, id]
  );
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const id = Number(params.id);
  const { rowCount } = await query('DELETE FROM customers WHERE id = $1', [id]);
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
