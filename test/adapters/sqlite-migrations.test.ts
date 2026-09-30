import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  openSqliteDatabase,
  SqlitePriceRepository,
  SqliteProductRepository,
} from '../../src/adapters/persistence/sqlite/index.ts';
import { formatIsoDate } from '../../src/domain/index.ts';

/** Schema as it was before any migration (products.size, observed_at TEXT). */
const LEGACY_SCHEMA = `
  CREATE TABLE stores (id TEXT PRIMARY KEY, name TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE);
  CREATE TABLE products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT, size TEXT, search_key TEXT NOT NULL
  );
  CREATE TABLE price_observations (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products (id),
    store_id TEXT NOT NULL REFERENCES stores (id),
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    currency TEXT NOT NULL,
    observed_at TEXT NOT NULL
  );
  INSERT INTO stores VALUES ('s1', 'Mercadona', 'mercadona');
  INSERT INTO products VALUES ('p1', 'Leche', 'Hacendado', '1 L', 'leche hacendado 1 l');
  INSERT INTO price_observations VALUES ('o1', 'p1', 's1', 95, 'EUR', '2026-09-01');
`;

describe('SQLite migrations', () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cartrac-'));
    path = join(dir, 'legacy.db');
    const legacy = new DatabaseSync(path);
    legacy.exec(LEGACY_SCHEMA);
    legacy.close();
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('renames products.size to products.unit keeping existing data', async () => {
    const db = openSqliteDatabase(path);
    const product = await new SqliteProductRepository(db).findById('p1');
    db.close();

    assert.equal(product?.unit, '1 L');
  });

  it('changes price_observations.observed_at to DATE keeping existing data', async () => {
    const db = openSqliteDatabase(path);
    const column = (
      db.prepare('PRAGMA table_info(price_observations)').all() as unknown as {
        name: string;
        type: string;
      }[]
    ).find((c) => c.name === 'observed_at');
    const [observation] = await new SqlitePriceRepository(db).findByProducts(['p1']);
    db.close();

    assert.equal(column?.type, 'DATE');
    assert.ok(observation?.observedAt instanceof Date);
    assert.equal(formatIsoDate(observation.observedAt), '2026-09-01');
  });

  it('is idempotent and keeps rejecting invalid dates', () => {
    openSqliteDatabase(path).close();
    const db = openSqliteDatabase(path);
    const insert = (date: string) =>
      db
        .prepare(`INSERT INTO price_observations VALUES (?, 'p1', 's1', 100, 'EUR', ?)`)
        .run(`o-${date}`, date);

    assert.doesNotThrow(() => insert('2026-09-30'));
    assert.throws(() => insert('2026-02-30'), /CHECK constraint failed/);
    assert.throws(() => insert('30/09/2026'), /CHECK constraint failed/);
    db.close();
  });
});
