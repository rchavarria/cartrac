import type { PriceRecord } from '../../ports/index.ts';

/** Column / property names used in CSV and JSON files. */
export const RECORD_FIELDS = [
  'date',
  'store',
  'product',
  'brand',
  'unit',
  'price',
  'currency',
] as const;

export type RecordField = (typeof RECORD_FIELDS)[number];

export const DEFAULT_CURRENCY = 'EUR';

export function recordFromFields(
  fields: Readonly<Record<string, unknown>>,
  location: string,
): PriceRecord {
  const optional = (key: RecordField): string | null => {
    const value = fields[key];
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
  };
  const required = (key: RecordField): string => {
    const value = optional(key);
    if (value === null) throw new Error(`${location}: missing required field "${key}"`);
    return value;
  };

  return {
    observedAt: required('date'),
    storeName: required('store'),
    productName: required('product'),
    brand: optional('brand'),
    unit: optional('unit'),
    price: required('price'),
    currency: optional('currency') ?? DEFAULT_CURRENCY,
  };
}

export function recordToFields(record: PriceRecord): Record<RecordField, string> {
  return {
    date: record.observedAt,
    store: record.storeName,
    product: record.productName,
    brand: record.brand ?? '',
    unit: record.unit ?? '',
    price: record.price,
    currency: record.currency,
  };
}
