import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DataExporter, PriceRecord } from '../../ports/index.ts';
import { toCsvLine } from './csv.ts';
import { RECORD_FIELDS, recordToFields } from './price-record-mapping.ts';

export class CsvFileExporter implements DataExporter {
  readonly description: string;
  readonly #path: string;

  constructor(path: string) {
    this.#path = path;
    this.description = `CSV file "${path}"`;
  }

  async export(records: readonly PriceRecord[]): Promise<void> {
    const lines = [
      toCsvLine(RECORD_FIELDS),
      ...records.map((record) => {
        const fields = recordToFields(record);
        return toCsvLine(RECORD_FIELDS.map((field) => fields[field]));
      }),
    ];
    await mkdir(dirname(this.#path), { recursive: true });
    await writeFile(this.#path, `${lines.join('\n')}\n`, 'utf8');
  }
}
