import {
  type PriceObservation,
  type Product,
  type ProductId,
  ProductMatcher,
  type Store,
  type StoreId,
} from '../../../domain/index.ts';
import type { PriceRepository, ProductRepository, StoreRepository } from '../../../ports/index.ts';

/** In-memory adapters: handy for tests and for trying the app without a database. */
export class InMemoryProductRepository implements ProductRepository {
  readonly #items = new Map<ProductId, Product>();

  async save(product: Product): Promise<void> {
    this.#items.set(product.id, product);
  }

  async findById(id: ProductId): Promise<Product | undefined> {
    return this.#items.get(id);
  }

  async search(query: string): Promise<Product[]> {
    const terms = ProductMatcher.normalize(query).split(' ').filter(Boolean);
    if (terms.length === 0) return [];
    return [...this.#items.values()].filter((product) => {
      const key = ProductMatcher.key(product);
      return terms.every((term) => key.includes(term));
    });
  }

  async findAll(): Promise<Product[]> {
    return [...this.#items.values()];
  }
}

export class InMemoryStoreRepository implements StoreRepository {
  readonly #items = new Map<StoreId, Store>();

  async save(store: Store): Promise<void> {
    this.#items.set(store.id, store);
  }

  async findById(id: StoreId): Promise<Store | undefined> {
    return this.#items.get(id);
  }

  async findByName(name: string): Promise<Store | undefined> {
    const key = ProductMatcher.normalize(name);
    return [...this.#items.values()].find((store) => ProductMatcher.normalize(store.name) === key);
  }

  async findAll(): Promise<Store[]> {
    return [...this.#items.values()];
  }
}

export class InMemoryPriceRepository implements PriceRepository {
  readonly #items: PriceObservation[] = [];

  async save(observation: PriceObservation): Promise<void> {
    this.#items.push(observation);
  }

  async findByProducts(productIds: readonly ProductId[]): Promise<PriceObservation[]> {
    const ids = new Set(productIds);
    return this.#sorted().filter((observation) => ids.has(observation.productId));
  }

  async findAll(): Promise<PriceObservation[]> {
    return this.#sorted();
  }

  #sorted(): PriceObservation[] {
    // Most recent first; for equal dates, last inserted first.
    return [...this.#items]
      .reverse()
      .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
  }
}
