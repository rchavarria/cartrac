import {
  type IsoDate,
  type Money,
  type PriceObservation,
  type Product,
  type ProductId,
  ProductMatcher,
} from '../domain/index.ts';
import type { PriceRepository, ProductRepository, StoreRepository } from '../ports/index.ts';

/** Read model returned by query use cases: a price observation with its product and store resolved. */
export interface PriceView {
  readonly productId: ProductId;
  readonly productName: string;
  readonly brand: string | null;
  readonly size: string | null;
  readonly storeName: string;
  readonly price: Money;
  readonly observedAt: IsoDate;
}

export interface CatalogRepositories {
  readonly products: ProductRepository;
  readonly stores: StoreRepository;
  readonly prices: PriceRepository;
}

export async function toPriceViews(
  observations: readonly PriceObservation[],
  products: readonly Product[],
  repositories: Pick<CatalogRepositories, 'stores'>,
): Promise<PriceView[]> {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const storesById = new Map(
    (await repositories.stores.findAll()).map((store) => [store.id, store]),
  );

  return observations.flatMap((observation) => {
    const product = productsById.get(observation.productId);
    const store = storesById.get(observation.storeId);
    if (!product || !store) return [];
    return [
      {
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        size: product.size,
        storeName: store.name,
        price: observation.price,
        observedAt: observation.observedAt,
      },
    ];
  });
}

/** Price views (most recent first) for products matching `text`, optionally filtered by store. */
export async function findPriceViews(
  repositories: CatalogRepositories,
  text: string,
  storeFilter?: string,
): Promise<PriceView[]> {
  const products = await repositories.products.search(text);
  if (products.length === 0) return [];

  const observations = await repositories.prices.findByProducts(products.map((p) => p.id));
  const views = await toPriceViews(observations, products, repositories);

  if (!storeFilter) return views;
  const normalizedStore = ProductMatcher.normalize(storeFilter);
  return views.filter((view) => ProductMatcher.normalize(view.storeName).includes(normalizedStore));
}
