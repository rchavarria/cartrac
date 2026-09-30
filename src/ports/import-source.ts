import type { PriceRecord } from './price-record.ts';

/** Anything that can provide price records: CSV/JSON files, scrapers, supermarket APIs... */
export interface ImportSource {
  /** Human readable description of the origin, used in messages. */
  readonly description: string;
  read(): AsyncIterable<PriceRecord>;
}
