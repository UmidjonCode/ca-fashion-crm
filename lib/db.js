const { Pool } = require('pg');

// ─── Connection Pool ──────────────────────────────────────────────────────────
// Reads DATABASE_URL from environment.  In production this points to RDS;
// locally it points to the Docker Compose PostgreSQL container.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('@db') && !process.env.DATABASE_URL.includes('@localhost'))
    ? { rejectUnauthorized: false }   // RDS uses self-signed certs
    : false,
});

// ─── Schema Initialisation ────────────────────────────────────────────────────
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      phone      TEXT,
      company    TEXT,
      address    TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      sku        TEXT NOT NULL,
      category   TEXT NOT NULL,
      price      NUMERIC(10,2) NOT NULL DEFAULT 0,
      stock      INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id           SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL,
      customer_id  INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      status       TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'processing', 'shipped', 'delivered')),
      total        NUMERIC(10,2) NOT NULL DEFAULT 0,
      items_count  INTEGER NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM customers');
  if (rows[0].count > 0) return;

  const customers = [
    ['Sarah Mitchell', 'sarah@urbanthreads.co.uk', '+44 20 7946 0123', 'Urban Threads Ltd', '14 Camden High Street, London, NW1 0JH'],
    ['James Carter', 'j.carter@coastalapparel.co.uk', '+44 117 496 0233', 'Coastal Apparel', '8 Harbourside, Bristol, BS1 5UH'],
    ['Priya Sharma', 'priya@meridianfashion.co.uk', '+44 161 850 4471', 'Meridian Fashion', '52 Deansgate, Manchester, M3 2EN'],
    ['Tom Baxter', 'tom@northgatestyle.co.uk', '+44 113 320 7788', 'Northgate Style', '21 Briggate, Leeds, LS1 6HD'],
    ['Elena Rossi', 'elena@belladonna.co.uk', '+44 131 556 9012', 'Belladonna Boutique', '3 Rose Street, Edinburgh, EH2 2PR'],
    ['Marcus Webb', 'marcus@webbandsons.co.uk', '+44 121 643 5566', 'Webb & Sons Outfitters', '77 Corporation Street, Birmingham, B4 6TB'],
    ['Aisha Khan', 'aisha@stitchcollective.co.uk', '+44 29 2087 1234', 'The Stitch Collective', '19 St Mary Street, Cardiff, CF10 1AT'],
    ["Daniel O'Connor", 'dan@harbourtraders.ie', '+353 1 478 9900', 'Harbour Traders', '5 Grafton Street, Dublin 2, Ireland'],
  ];

  for (const [name, email, phone, company, address] of customers) {
    await pool.query(
      'INSERT INTO customers (name, email, phone, company, address) VALUES ($1, $2, $3, $4, $5)',
      [name, email, phone, company, address]
    );
  }

  const products = [
    ['Classic Cotton Crew Tee', 'TS-001', 'T-Shirts', 6.5, 1240],
    ['Heavyweight Pocket Tee', 'TS-014', 'T-Shirts', 8.25, 860],
    ['Premium Pullover Hoodie', 'HD-021', 'Hoodies', 14.0, 540],
    ['Zip-Through Hoodie', 'HD-028', 'Hoodies', 16.5, 95],
    ['Quilted Bomber Jacket', 'JK-033', 'Jackets', 28.0, 130],
    ['Waxed Field Jacket', 'JK-041', 'Jackets', 42.0, 0],
    ['Slim Stretch Chinos', 'TR-052', 'Trousers', 16.5, 410],
    ['Tapered Cargo Trousers', 'TR-058', 'Trousers', 19.0, 220],
    ['Merino Wool Jumper', 'KW-066', 'Knitwear', 22.0, 70],
    ['Cable-Knit Cardigan', 'KW-072', 'Knitwear', 24.5, 48],
    ['Canvas Tote Bag', 'AC-080', 'Accessories', 3.2, 2050],
    ['Ribbed Beanie Hat', 'AC-085', 'Accessories', 4.75, 1320],
  ];

  for (const [name, sku, category, price, stock] of products) {
    await pool.query(
      'INSERT INTO products (name, sku, category, price, stock) VALUES ($1, $2, $3, $4, $5)',
      [name, sku, category, price, stock]
    );
  }

  const orders = [
    ['ORD-1001', 1, 'delivered', 2860.0, 440, '2026-05-04 10:12:00'],
    ['ORD-1002', 3, 'delivered', 1740.5, 210, '2026-05-07 14:30:00'],
    ['ORD-1003', 2, 'shipped', 980.0, 120, '2026-05-12 09:05:00'],
    ['ORD-1004', 5, 'processing', 3420.0, 510, '2026-05-15 16:48:00'],
    ['ORD-1005', 4, 'shipped', 645.75, 75, '2026-05-18 11:20:00'],
    ['ORD-1006', 6, 'pending', 1290.0, 160, '2026-05-21 13:00:00'],
    ['ORD-1007', 7, 'delivered', 2210.0, 300, '2026-05-22 08:40:00'],
    ['ORD-1008', 8, 'processing', 1875.5, 240, '2026-05-25 15:15:00'],
    ['ORD-1009', 1, 'shipped', 530.0, 60, '2026-05-27 10:00:00'],
    ['ORD-1010', 3, 'pending', 4120.0, 600, '2026-05-28 17:30:00'],
  ];

  for (const [order_number, customer_id, status, total, items_count, created_at] of orders) {
    await pool.query(
      'INSERT INTO orders (order_number, customer_id, status, total, items_count, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [order_number, customer_id, status, total, items_count, created_at]
    );
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
// Run schema + seed once when the module is first imported.
let _ready = null;

function ensureReady() {
  if (!_ready) {
    _ready = initSchema().then(() => seed()).catch((err) => {
      console.error('[db] Init error:', err.message);
      _ready = null;              // allow retry on next request
      throw err;
    });
  }
  return _ready;
}

// ─── Public API ───────────────────────────────────────────────────────────────
// Every exported function awaits ensureReady() so the schema exists before
// the first query runs.

async function query(text, params) {
  await ensureReady();
  return pool.query(text, params);
}

async function getPool() {
  await ensureReady();
  return pool;
}

module.exports = { query, getPool, pool };
