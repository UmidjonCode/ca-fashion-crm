#!/usr/bin/env node
// ─── Standalone Seed Script ───────────────────────────────────────────────────
// Usage:  DATABASE_URL=postgresql://... node lib/seed.js
//
// Runs the same init+seed logic that the app uses on first boot, but as a
// standalone CLI tool.  Useful for:
//   • First-time RDS setup
//   • Resetting the database during development
//   • Running in a CI/CD "migration" step

const { query, pool } = require('./db');

async function main() {
  console.log('⏳ Connecting to PostgreSQL…');

  // ensureReady() is called automatically by the first query() call,
  // which runs initSchema() + seed().
  await query('SELECT 1');

  // Verify
  const { rows: customers } = await query('SELECT COUNT(*)::int AS c FROM customers');
  const { rows: products }  = await query('SELECT COUNT(*)::int AS c FROM products');
  const { rows: orders }    = await query('SELECT COUNT(*)::int AS c FROM orders');

  console.log('✅ Database ready!');
  console.log(`   Customers : ${customers[0].c}`);
  console.log(`   Products  : ${products[0].c}`);
  console.log(`   Orders    : ${orders[0].c}`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
