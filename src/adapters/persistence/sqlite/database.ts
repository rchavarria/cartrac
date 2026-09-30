import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * SQLite has no native date storage: DATE columns hold ISO 8601 text (YYYY-MM-DD).
 * The CHECK constraint rejects anything that is not a valid calendar date in that format.
 */
const priceObservationsTable = (name: string) => `
  CREATE TABLE IF NOT EXISTS ${name} (
    id           TEXT PRIMARY KEY,
    product_id   TEXT NOT NULL REFERENCES products (id),
    store_id     TEXT NOT NULL REFERENCES stores (id),
    price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),
    currency     TEXT NOT NULL,
    observed_at  DATE NOT NULL CHECK (observed_at IS date(observed_at))
  );
`;

const PRICE_OBSERVATIONS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_price_observations_product
    ON price_observations (product_id, observed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_price_observations_store
    ON price_observations (store_id);
`;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS stores (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    name_key  TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    brand       TEXT,
    unit        TEXT,
    search_key  TEXT NOT NULL
  );

  ${priceObservationsTable('price_observations')}
  ${PRICE_OBSERVATIONS_INDEXES}
`;

export type SqliteDatabase = DatabaseSync;

/** Opens (and migrates) a SQLite database. Use ":memory:" for an ephemeral database. */
export function openSqliteDatabase(path: string): SqliteDatabase {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

interface ColumnInfo {
  name: string;
  type: string;
}

function columns(db: SqliteDatabase, table: string): ColumnInfo[] {
  return db.prepare(`PRAGMA table_info(${table})`).all() as unknown as ColumnInfo[];
}

/** Upgrades databases created with older schemas. Each step must be idempotent. */
function migrate(db: SqliteDatabase): void {
  // products.size was renamed to products.unit
  if (columns(db, 'products').some((column) => column.name === 'size')) {
    db.exec('ALTER TABLE products RENAME COLUMN size TO unit');
  }

  // price_observations.observed_at changed from TEXT to DATE (SQLite requires rebuilding the table)
  const observedAt = columns(db, 'price_observations').find((c) => c.name === 'observed_at');
  if (observedAt && observedAt.type.toUpperCase() !== 'DATE') {
    db.exec(`
      BEGIN;
      ${priceObservationsTable('price_observations_new')}
      INSERT INTO price_observations_new (id, product_id, store_id, price_cents, currency, observed_at)
        SELECT id, product_id, store_id, price_cents, currency, observed_at FROM price_observations;
      DROP TABLE price_observations;
      ALTER TABLE price_observations_new RENAME TO price_observations;
      ${PRICE_OBSERVATIONS_INDEXES}
      COMMIT;
    `);
  }
}
