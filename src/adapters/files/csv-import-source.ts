import { readFile } from 'node:fs/promises';
import type { ImportSource, PriceRecord } from '../../ports/index.ts';
import { detectDelimiter, parseCsv } from './csv.ts';
import { recordFromFields } from './price-record-mapping.ts';

/** Reads a CSV with header: date,store,product,brand,unit,price,currency */
export class CsvImportSource implements ImportSource {
  readonly description: string;
  readonly #path: string;

  constructor(path: string) {
    this.#path = path;
    this.description = `CSV file "${path}"`;
  }

  async *read(): AsyncIterable<PriceRecord> {
    const text = (await readFile(this.#path, 'utf8')).replace(/^\uFEFF/, '');
    const [header, ...rows] = parseCsv(text, detectDelimiter(text));
    if (!header) return;

    const columns = header.map((column) => column.trim().toLowerCase());
    for (const [index, row] of rows.entries()) {
      const fields = Object.fromEntries(columns.map((column, i) => [column, row[i]]));
      yield recordFromFields(fields, `line ${index + 2}`);
    }
  }
}
