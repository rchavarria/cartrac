import { createStore, ProductMatcher, type Store, type StoreId } from '../../../domain/index.ts';
import type { StoreRepository } from '../../../ports/index.ts';
import type { SqliteDatabase } from './database.ts';

interface StoreRow {
  id: string;
  name: string;
}

const toStore = (row: StoreRow): Store => createStore(row.name, row.id);
const nameKey = (name: string): string => ProductMatcher.normalize(name);

export class SqliteStoreRepository implements StoreRepository {
  readonly #db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.#db = db;
  }

  async save(store: Store): Promise<void> {
    this.#db
      .prepare(
        `INSERT INTO stores (id, name, name_key) VALUES (?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET name = excluded.name, name_key = excluded.name_key`,
      )
      .run(store.id, store.name, nameKey(store.name));
  }

  async findById(id: StoreId): Promise<Store | undefined> {
    const row = this.#db.prepare('SELECT id, name FROM stores WHERE id = ?').get(id) as unknown as
      | StoreRow
      | undefined;
    return row ? toStore(row) : undefined;
  }

  async findByName(name: string): Promise<Store | undefined> {
    const row = this.#db
      .prepare('SELECT id, name FROM stores WHERE name_key = ?')
      .get(nameKey(name)) as unknown as StoreRow | undefined;
    return row ? toStore(row) : undefined;
  }

  async findAll(): Promise<Store[]> {
    const rows = this.#db
      .prepare('SELECT id, name FROM stores ORDER BY name')
      .all() as unknown as StoreRow[];
    return rows.map(toStore);
  }
}
