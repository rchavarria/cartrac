import type { ComparisonRow, PriceView } from '../../application/index.ts';
import type { OutputFormatter } from './output-formatter.ts';

const serializePrice = (view: PriceView) => ({
  date: view.observedAt,
  store: view.storeName,
  product: view.productName,
  brand: view.brand,
  unit: view.unit,
  price: view.price.toDecimalString(),
  currency: view.price.currency,
});

export class JsonFormatter implements OutputFormatter {
  formatPrices(rows: readonly PriceView[]): string {
    return JSON.stringify(rows.map(serializePrice), null, 2);
  }

  formatComparison(rows: readonly ComparisonRow[]): string {
    return JSON.stringify(
      rows.map((row) => ({
        ...serializePrice(row),
        cheapest: row.cheapest,
        percentAboveCheapest:
          row.percentAboveCheapest === null ? null : Number(row.percentAboveCheapest.toFixed(2)),
      })),
      null,
      2,
    );
  }
}
