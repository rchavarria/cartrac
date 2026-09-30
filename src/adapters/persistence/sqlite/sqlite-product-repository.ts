import {
  createProduct,
  type Product,
  type ProductId,
  ProductMatcher,
} from '../../../domain/index.ts';
import type { ProductRepository } from '../../../ports/index.ts';
import type { SqliteDatabase } from './database.ts';

interface ProductRow {
  id: string;
  name: string;
  brand: string | null;
  size: string | null;
}

const toProduct = (row: ProductRow): Product =>
  createProduct({ name: row.name, brand: row.brand, size: row.size }, row.id);

export class SqliteProductRepository implements ProductRepository {
  readonly #db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.#db = db;
  }

  async save(product: Product): Promise<void> {
    this.#db
      .prepare(
        `INSERT INTO products (id, name, brand, size, search_key) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           name = excluded.name, brand = excluded.brand,
           size = excluded.size, search_key = excluded.search_key`,
      )
      .run(product.id, product.name, product.brand, product.size, ProductMatcher.key(product));
  }

  async findById(id: ProductId): Promise<Product | undefined> {
    const row = this.#db
      .prepare('SELECT id, name, brand, size FROM products WHERE id = ?')
      .get(id) as unknown as ProductRow | undefined;
    return row ? toProduct(row) : undefined;
  }

  async search(query: string): Promise<Product[]> {
    const terms = ProductMatcher.normalize(query).split(' ').filter(Boolean);
    if (terms.length === 0) return [];

    const where = terms.map(() => 'search_key LIKE ?').join(' AND ');
    const rows = this.#db
      .prepare(`SELECT id, name, brand, size FROM products WHERE ${where} ORDER BY name`)
      .all(...terms.map((term) => `%${term}%`)) as unknown as ProductRow[];
    return rows.map(toProduct);
  }

  async findAll(): Promise<Product[]> {
    const rows = this.#db
      .prepare('SELECT id, name, brand, size FROM products ORDER BY name')
      .all() as unknown as ProductRow[];
    return rows.map(toProduct);
  }
}
