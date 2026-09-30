import { type CatalogRepositories, findPriceViews, type PriceView } from './price-view.ts';

export interface ComparisonRow extends PriceView {
  readonly cheapest: boolean;
  /** How much more expensive than the cheapest store for the same product (null if not comparable). */
  readonly percentAboveCheapest: number | null;
}

/** Latest price of each matching product in every store, cheapest first. */
export class CompareProducts {
  readonly #repositories: CatalogRepositories;

  constructor(repositories: CatalogRepositories) {
    this.#repositories = repositories;
  }

  async execute(text: string): Promise<ComparisonRow[]> {
    const views = await findPriceViews(this.#repositories, text);

    // Views come most recent first, so the first one seen per product/store is the latest.
    const latestByProduct = new Map<string, Map<string, PriceView>>();
    for (const view of views) {
      const byStore = latestByProduct.get(view.productId) ?? new Map<string, PriceView>();
      if (!byStore.has(view.storeName)) byStore.set(view.storeName, view);
      latestByProduct.set(view.productId, byStore);
    }

    const rows: ComparisonRow[] = [];
    for (const byStore of latestByProduct.values()) {
      const latest = [...byStore.values()].sort((a, b) => a.price.cents - b.price.cents);
      const cheapest = latest[0];
      if (!cheapest) continue;
      for (const view of latest) {
        const comparable = view.price.currency === cheapest.price.currency;
        rows.push({
          ...view,
          cheapest: comparable && view.price.cents === cheapest.price.cents,
          percentAboveCheapest: comparable ? view.price.percentAbove(cheapest.price) : null,
        });
      }
    }

    return rows.sort(
      (a, b) => a.productName.localeCompare(b.productName) || a.price.cents - b.price.cents,
    );
  }
}
