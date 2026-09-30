import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DataExporter, PriceRecord } from '../../ports/index.ts';
import { recordToFields } from './price-record-mapping.ts';

export class JsonFileExporter implements DataExporter {
  readonly description: string;
  readonly #path: string;

  constructor(path: string) {
    this.#path = path;
    this.description = `JSON file "${path}"`;
  }

  async export(records: readonly PriceRecord[]): Promise<void> {
    await mkdir(dirname(this.#path), { recursive: true });
    await writeFile(
      this.#path,
      `${JSON.stringify(records.map(recordToFields), null, 2)}\n`,
      'utf8',
    );
  }
}
