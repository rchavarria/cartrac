import { homedir } from 'node:os';
import { extname, join } from 'node:path';
import {
  CsvFileExporter,
  CsvImportSource,
  JsonFileExporter,
  JsonImportSource,
} from './adapters/files/index.ts';
import {
  JsonFormatter,
  type OutputFormat,
  type OutputFormatter,
  TableFormatter,
} from './adapters/formatters/index.ts';
import {
  openSqliteDatabase,
  SqlitePriceRepository,
  SqliteProductRepository,
  SqliteStoreRepository,
} from './adapters/persistence/sqlite/index.ts';
import {
  type CatalogRepositories,
  CompareProducts,
  ExportData,
  ImportPrices,
  SearchPrices,
} from './application/index.ts';
import { ProductMatcher } from './domain/index.ts';
import type { DataExporter, ImportSource } from './ports/index.ts';

export type FileFormat = 'csv' | 'json';
export const FILE_FORMATS: readonly FileFormat[] = ['csv', 'json'];

export interface AppConfig {
  readonly databasePath: string;
}

/**
 * Composition root: the only place that knows about concrete adapters.
 * The CLI only talks to use cases and to these factories.
 */
export interface Container {
  readonly importPrices: ImportPrices;
  readonly searchPrices: SearchPrices;
  readonly compareProducts: CompareProducts;
  readonly exportData: ExportData;
  createImportSource(path: string, format?: FileFormat): ImportSource;
  createExporter(path: string, format?: FileFormat): DataExporter;
  createFormatter(format: OutputFormat): OutputFormatter;
  close(): void;
}

export function defaultDatabasePath(): string {
  return process.env.CARTRAC_DB ?? join(homedir(), '.cartrac', 'cartrac.db');
}

function resolveFileFormat(path: string, format?: FileFormat): FileFormat {
  if (format) return format;
  const extension = extname(path).slice(1).toLowerCase();
  if (extension === 'csv' || extension === 'json') return extension;
  throw new Error(`Cannot infer file format from "${path}". Use --format csv|json.`);
}

export function createContainer(config: AppConfig): Container {
  const db = openSqliteDatabase(config.databasePath);
  const repositories: CatalogRepositories = {
    products: new SqliteProductRepository(db),
    stores: new SqliteStoreRepository(db),
    prices: new SqlitePriceRepository(db),
  };

  return {
    importPrices: new ImportPrices({ ...repositories, matcher: new ProductMatcher() }),
    searchPrices: new SearchPrices(repositories),
    compareProducts: new CompareProducts(repositories),
    exportData: new ExportData(repositories),

    createImportSource: (path, format) =>
      resolveFileFormat(path, format) === 'csv'
        ? new CsvImportSource(path)
        : new JsonImportSource(path),

    createExporter: (path, format) =>
      resolveFileFormat(path, format) === 'csv'
        ? new CsvFileExporter(path)
        : new JsonFileExporter(path),

    createFormatter: (format) => (format === 'json' ? new JsonFormatter() : new TableFormatter()),

    close: () => db.close(),
  };
}
