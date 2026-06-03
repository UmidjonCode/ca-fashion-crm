import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { rows: [{ c: customers }] } = await query('SELECT COUNT(*)::int AS c FROM customers');
  const { rows: [{ c: orders }] }    = await query('SELECT COUNT(*)::int AS c FROM orders');
  const { rows: [{ s: revenue }] }   = await query('SELECT COALESCE(SUM(total), 0)::numeric AS s FROM orders');
  const { rows: [{ c: activeShipments }] } = await query(
    "SELECT COUNT(*)::int AS c FROM orders WHERE status = 'shipped'"
  );

  const { rows: recentOrders } = await query(
    `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
            c.company AS customer
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     ORDER BY o.created_at DESC
     LIMIT 6`
  );

  const statusBreakdown = { pending: 0, processing: 0, shipped: 0, delivered: 0 };
  const { rows: breakdownRows } = await query(
    'SELECT status, COUNT(*)::int AS c FROM orders GROUP BY status'
  );
  for (const row of breakdownRows) {
    statusBreakdown[row.status] = row.c;
  }

  return NextResponse.json({
    kpis: { customers, orders, revenue: Number(revenue), activeShipments },
    recentOrders,
    statusBreakdown,
  });
}
