import { readFile } from 'node:fs/promises';
import type { ImportSource, PriceRecord } from '../../ports/index.ts';
import { recordFromFields } from './price-record-mapping.ts';

/** Reads a JSON array of objects: [{ "date", "store", "product", "brand", "unit", "price", "currency" }] */
export class JsonImportSource implements ImportSource {
  readonly description: string;
  readonly #path: string;

  constructor(path: string) {
    this.#path = path;
    this.description = `JSON file "${path}"`;
  }

  async *read(): AsyncIterable<PriceRecord> {
    const data: unknown = JSON.parse(await readFile(this.#path, 'utf8'));
    if (!Array.isArray(data)) {
      throw new Error(`${this.description} must contain a JSON array`);
    }
    for (const [index, item] of data.entries()) {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        throw new Error(`item ${index}: expected an object`);
      }
      yield recordFromFields(item as Record<string, unknown>, `item ${index}`);
    }
  }
}
