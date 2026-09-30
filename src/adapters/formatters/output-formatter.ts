import type { ComparisonRow, PriceView } from '../../application/index.ts';

export interface OutputFormatter {
  formatPrices(rows: readonly PriceView[]): string;
  formatComparison(rows: readonly ComparisonRow[]): string;
}

export type OutputFormat = 'table' | 'json';
export const OUTPUT_FORMATS: readonly OutputFormat[] = ['table', 'json'];
