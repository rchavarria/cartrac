import { formatIsoDate } from '../domain/index.ts';
import type { DataExporter, PriceRecord } from '../ports/index.ts';
import { type CatalogRepositories, toPriceViews } from './price-view.ts';

/** Exports every stored price observation through the given exporter. Returns the record count. */
export class ExportData {
  readonly #repositories: CatalogRepositories;

  constructor(repositories: CatalogRepositories) {
    this.#repositories = repositories;
  }

  async execute(exporter: DataExporter): Promise<number> {
    const [products, observations] = await Promise.all([
      this.#repositories.products.findAll(),
      this.#repositories.prices.findAll(),
    ]);
    const views = await toPriceViews(observations, products, this.#repositories);

    const records: PriceRecord[] = views.map((view) => ({
      observedAt: formatIsoDate(view.observedAt),
      storeName: view.storeName,
      productName: view.productName,
      brand: view.brand,
      unit: view.unit,
      price: view.price.toDecimalString(),
      currency: view.price.currency,
    }));

    await exporter.export(records);
    return records.length;
  }
}
