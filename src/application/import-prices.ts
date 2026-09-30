import {
  createPriceObservation,
  createProduct,
  createStore,
  Money,
  type Product,
  type ProductMatcher,
  type Store,
} from '../domain/index.ts';
import type { ImportSource, PriceRecord } from '../ports/index.ts';
import type { CatalogRepositories } from './price-view.ts';

export interface ImportPricesDependencies extends CatalogRepositories {
  readonly matcher: ProductMatcher;
}

export interface ImportResult {
  readonly observations: number;
  readonly newProducts: number;
  readonly newStores: number;
}

/** Imports price records from any source, reusing existing products/stores when they match. */
export class ImportPrices {
  readonly #deps: ImportPricesDependencies;

  constructor(deps: ImportPricesDependencies) {
    this.#deps = deps;
  }

  async execute(source: ImportSource): Promise<ImportResult> {
    const knownProducts = await this.#deps.products.findAll();
    let observations = 0;
    let newProducts = 0;
    let newStores = 0;
    let index = 0;

    for await (const record of source.read()) {
      index++;
      try {
        const store = await this.#resolveStore(record, () => newStores++);
        const product = await this.#resolveProduct(record, knownProducts, () => newProducts++);
        await this.#deps.prices.save(
          createPriceObservation({
            productId: product.id,
            storeId: store.id,
            price: Money.parse(record.price, record.currency),
            observedAt: record.observedAt,
          }),
        );
        observations++;
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Record #${index} from ${source.description}: ${reason}`, { cause: error });
      }
    }

    return { observations, newProducts, newStores };
  }

  async #resolveStore(record: PriceRecord, onCreated: () => void): Promise<Store> {
    const existing = await this.#deps.stores.findByName(record.storeName);
    if (existing) return existing;

    const store = createStore(record.storeName);
    await this.#deps.stores.save(store);
    onCreated();
    return store;
  }

  async #resolveProduct(
    record: PriceRecord,
    knownProducts: Product[],
    onCreated: () => void,
  ): Promise<Product> {
    const candidate = createProduct({
      name: record.productName,
      brand: record.brand,
      unit: record.unit,
    });
    const existing = this.#deps.matcher.findBestMatch(candidate, knownProducts);
    if (existing) return existing;

    await this.#deps.products.save(candidate);
    knownProducts.push(candidate);
    onCreated();
    return candidate;
  }
}
