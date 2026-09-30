import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import {
  openSqliteDatabase,
  SqliteProductRepository,
} from '../../src/adapters/persistence/sqlite/index.ts';

describe('SQLite migrations', () => {
  it('renames products.size to products.unit keeping existing data', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cartrac-'));
    const path = join(dir, 'old.db');
    try {
      const old = new DatabaseSync(path);
      old.exec(`CREATE TABLE products (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT, size TEXT, search_key TEXT NOT NULL
      )`);
      old.exec(
        `INSERT INTO products VALUES ('p1', 'Leche', 'Hacendado', '1 L', 'leche hacendado 1 l')`,
      );
      old.close();

      const db = openSqliteDatabase(path);
      const product = await new SqliteProductRepository(db).findById('p1');
      db.close();

      assert.equal(product?.unit, '1 L');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
