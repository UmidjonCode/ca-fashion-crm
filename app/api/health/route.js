import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await query('SELECT 1');
    return NextResponse.json({ status: 'healthy', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { status: 'unhealthy', db: 'disconnected', error: err.message },
      { status: 503 }
    );
  }
}
