import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  InMemoryPriceRepository,
  InMemoryProductRepository,
  InMemoryStoreRepository,
} from '../../src/adapters/persistence/in-memory/in-memory-repositories.ts';
import {
  type CatalogRepositories,
  CompareProducts,
  ExportData,
  ImportPrices,
  SearchPrices,
} from '../../src/application/index.ts';
import { formatIsoDate, ProductMatcher } from '../../src/domain/index.ts';
import type { DataExporter, ImportSource, PriceRecord } from '../../src/ports/index.ts';

const record = (overrides: Partial<PriceRecord>): PriceRecord => ({
  observedAt: '2026-09-01',
  storeName: 'Mercadona',
  productName: 'Leche entera',
  brand: 'Hacendado',
  unit: '1 L',
  price: '0.95',
  currency: 'EUR',
  ...overrides,
});

const sourceOf = (records: PriceRecord[]): ImportSource => ({
  description: 'test source',
  async *read() {
    yield* records;
  },
});

describe('application use cases', () => {
  let repositories: CatalogRepositories;

  beforeEach(async () => {
    repositories = {
      products: new InMemoryProductRepository(),
      stores: new InMemoryStoreRepository(),
      prices: new InMemoryPriceRepository(),
    };
    await new ImportPrices({ ...repositories, matcher: new ProductMatcher() }).execute(
      sourceOf([
        record({}),
        record({ observedAt: '2026-09-15', price: '0.99' }),
        record({ storeName: 'Carrefour', productName: 'LECHE ENTERA', unit: '1L', price: '1.09' }),
        record({
          storeName: 'Carrefour',
          productName: 'Pan de molde',
          brand: 'Bimbo',
          price: '2.10',
        }),
      ]),
    );
  });

  it('ImportPrices reuses matching products and stores', async () => {
    assert.equal((await repositories.products.findAll()).length, 2);
    assert.equal((await repositories.stores.findAll()).length, 2);
    assert.equal((await repositories.prices.findAll()).length, 4);
  });

  it('ImportPrices reports the failing record', async () => {
    const importPrices = new ImportPrices({ ...repositories, matcher: new ProductMatcher() });
    await assert.rejects(
      importPrices.execute(sourceOf([record({ price: 'free' })])),
      /Record #1 from test source/,
    );
  });

  it('SearchPrices returns the history most recent first, filtered by store', async () => {
    const rows = await new SearchPrices(repositories).execute({ text: 'leche', store: 'merca' });
    assert.deepEqual(
      rows.map((r) => [formatIsoDate(r.observedAt), r.price.toDecimalString()]),
      [
        ['2026-09-15', '0.99'],
        ['2026-09-01', '0.95'],
      ],
    );
  });

  it('CompareProducts uses the latest price per store, cheapest first', async () => {
    const rows = await new CompareProducts(repositories).execute('leche');
    assert.deepEqual(
      rows.map((r) => [r.storeName, r.price.toDecimalString(), r.cheapest]),
      [
        ['Mercadona', '0.99', true],
        ['Carrefour', '1.09', false],
      ],
    );
    assert.equal(rows[1]?.percentAboveCheapest?.toFixed(1), '10.1');
  });

  it('ExportData sends every observation to the exporter', async () => {
    let exported: readonly PriceRecord[] = [];
    const exporter: DataExporter = {
      description: 'memory',
      async export(records) {
        exported = records;
      },
    };
    assert.equal(await new ExportData(repositories).execute(exporter), 4);
    assert.equal(exported.length, 4);
  });
});
