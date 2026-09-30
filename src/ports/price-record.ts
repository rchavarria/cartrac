/**
 * Flat, technology-agnostic representation of a price observation used to exchange data
 * with the outside world (files, scrapers, APIs...). Import and export share this shape,
 * so an exported file can be imported back.
 */
export interface PriceRecord {
  /** YYYY-MM-DD */
  readonly observedAt: string;
  readonly storeName: string;
  readonly productName: string;
  readonly brand: string | null;
  readonly size: string | null;
  /** Decimal amount, e.g. "1.25" */
  readonly price: string;
  /** ISO 4217 code, e.g. "EUR" */
  readonly currency: string;
}
