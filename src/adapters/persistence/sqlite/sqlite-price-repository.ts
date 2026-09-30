import {
  createPriceObservation,
  Money,
  type PriceObservation,
  type ProductId,
} from '../../../domain/index.ts';
import type { PriceRepository } from '../../../ports/index.ts';
import type { SqliteDatabase } from './database.ts';

interface PriceObservationRow {
  id: string;
  product_id: string;
  store_id: string;
  price_cents: number;
  currency: string;
  observed_at: string;
}

const COLUMNS = 'id, product_id, store_id, price_cents, currency, observed_at';
const ORDER = 'ORDER BY observed_at DESC, rowid DESC';

const toObservation = (row: PriceObservationRow): PriceObservation =>
  createPriceObservation(
    {
      productId: row.product_id,
      storeId: row.store_id,
      price: Money.fromCents(row.price_cents, row.currency),
      observedAt: row.observed_at,
    },
    row.id,
  );

export class SqlitePriceRepository implements PriceRepository {
  readonly #db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.#db = db;
  }

  async save(observation: PriceObservation): Promise<void> {
    this.#db
      .prepare(
        `INSERT INTO price_observations (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO NOTHING`,
      )
      .run(
        observation.id,
        observation.productId,
        observation.storeId,
        observation.price.cents,
        observation.price.currency,
        observation.observedAt,
      );
  }

  async findByProducts(productIds: readonly ProductId[]): Promise<PriceObservation[]> {
    if (productIds.length === 0) return [];
    const placeholders = productIds.map(() => '?').join(', ');
    const rows = this.#db
      .prepare(
        `SELECT ${COLUMNS} FROM price_observations WHERE product_id IN (${placeholders}) ${ORDER}`,
      )
      .all(...productIds) as unknown as PriceObservationRow[];
    return rows.map(toObservation);
  }

  async findAll(): Promise<PriceObservation[]> {
    const rows = this.#db
      .prepare(`SELECT ${COLUMNS} FROM price_observations ${ORDER}`)
      .all() as unknown as PriceObservationRow[];
    return rows.map(toObservation);
  }
}
