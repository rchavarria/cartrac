import type { ComparisonRow, PriceView } from '../../application/index.ts';
import type { OutputFormatter } from './output-formatter.ts';

const EMPTY = 'No results.';

function renderTable(headers: readonly string[], rows: readonly string[][]): string {
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => (row[i] ?? '').length)),
  );
  const line = (cells: readonly string[]) =>
    cells
      .map((cell, i) => cell.padEnd(widths[i] ?? 0))
      .join('  ')
      .trimEnd();
  return [line(headers), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}

export class TableFormatter implements OutputFormatter {
  formatPrices(rows: readonly PriceView[]): string {
    if (rows.length === 0) return EMPTY;
    return renderTable(
      ['Date', 'Store', 'Product', 'Brand', 'Unit', 'Price'],
      rows.map((r) => [
        r.observedAt,
        r.storeName,
        r.productName,
        r.brand ?? '',
        r.unit ?? '',
        r.price.toString(),
      ]),
    );
  }

  formatComparison(rows: readonly ComparisonRow[]): string {
    if (rows.length === 0) return EMPTY;
    return renderTable(
      ['Product', 'Brand', 'Unit', 'Store', 'Price', 'Date', 'vs cheapest'],
      rows.map((r) => [
        r.productName,
        r.brand ?? '',
        r.unit ?? '',
        r.storeName,
        r.price.toString(),
        r.observedAt,
        r.cheapest
          ? '★ cheapest'
          : r.percentAboveCheapest === null
            ? 'n/a'
            : `+${r.percentAboveCheapest.toFixed(1)}%`,
      ]),
    );
  }
}
