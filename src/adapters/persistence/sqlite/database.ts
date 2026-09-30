import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

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
    size        TEXT,
    search_key  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS price_observations (
    id           TEXT PRIMARY KEY,
    product_id   TEXT NOT NULL REFERENCES products (id),
    store_id     TEXT NOT NULL REFERENCES stores (id),
    price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),
    currency     TEXT NOT NULL,
    observed_at  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_price_observations_product
    ON price_observations (product_id, observed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_price_observations_store
    ON price_observations (store_id);
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
  return db;
}
