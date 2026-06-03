import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { rows } = await query('SELECT * FROM customers ORDER BY id DESC');
  return NextResponse.json(rows);
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { name, email, phone, company, address } = body;
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  const { rows } = await query(
    'INSERT INTO customers (name, email, phone, company, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name.trim(), email.trim(), phone?.trim() || null, company?.trim() || null, address?.trim() || null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
