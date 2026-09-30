import type { PriceRecord } from './price-record.ts';

/** Destination for exported data (CSV/JSON files, remote services...). */
export interface DataExporter {
  readonly description: string;
  export(records: readonly PriceRecord[]): Promise<void>;
}
