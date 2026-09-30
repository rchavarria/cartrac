import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import {
  openSqliteDatabase,
  type SqliteDatabase,
  SqlitePriceRepository,
  SqliteProductRepository,
  SqliteStoreRepository,
} from '../../src/adapters/persistence/sqlite/index.ts';
import {
  createPriceObservation,
  createProduct,
  createStore,
  Money,
  parseIsoDate,
} from '../../src/domain/index.ts';

describe('SQLite repositories', () => {
  let db: SqliteDatabase;
  let products: SqliteProductRepository;
  let stores: SqliteStoreRepository;
  let prices: SqlitePriceRepository;

  before(() => {
    db = openSqliteDatabase(':memory:');
    products = new SqliteProductRepository(db);
    stores = new SqliteStoreRepository(db);
    prices = new SqlitePriceRepository(db);
  });

  after(() => db.close());

  it('stores and retrieves products, stores and prices', async () => {
    const product = createProduct({ name: 'Café molido', brand: 'Marcilla', unit: '250 g' });
    const store = createStore('Día');
    await products.save(product);
    await stores.save(store);
    await prices.save(
      createPriceObservation({
        productId: product.id,
        storeId: store.id,
        price: Money.parse('3.45'),
        observedAt: parseIsoDate('2026-09-10'),
      }),
    );

    assert.deepEqual(await products.findById(product.id), product);
    assert.deepEqual(await stores.findByName('dia'), store);
    assert.deepEqual(
      (await products.search('cafe marcilla')).map((p) => p.id),
      [product.id],
    );

    const [observation] = await prices.findByProducts([product.id]);
    assert.equal(observation?.price.toString(), '3.45 EUR');
    assert.deepEqual(observation?.observedAt, new Date('2026-09-10T00:00:00Z'));
  });
});
