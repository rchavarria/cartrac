import { type CatalogRepositories, findPriceViews, type PriceView } from './price-view.ts';

export interface SearchPricesQuery {
  readonly text: string;
  readonly store?: string | undefined;
}

/** Price history (most recent first) of the products matching a free-text query. */
export class SearchPrices {
  readonly #repositories: CatalogRepositories;

  constructor(repositories: CatalogRepositories) {
    this.#repositories = repositories;
  }

  execute(query: SearchPricesQuery): Promise<PriceView[]> {
    return findPriceViews(this.#repositories, query.text, query.store);
  }
}
