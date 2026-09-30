import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
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
/** Project root: this file lives in `src/` (or `dist/` once compiled), one level below. */
export const PROJECT_ROOT = resolve(import.meta.dirname, '..');
export const DEFAULT_DATABASE_PATH = 'data/cartrac.db';
export interface AppConfig {
  /** Relative to the project root, e.g. "data/cartrac.db". */
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
/** Database path relative to the project root (`--db` > `CARTRAC_DB` > `data/cartrac.db`). */
export function defaultDatabasePath(): string {
  return process.env.CARTRAC_DB ?? DEFAULT_DATABASE_PATH;
}
/**
 * Resolves a database path against the project root. Only relative paths that stay inside the
 * project are accepted, so the database never ends up scattered around the file system.
 */
export function resolveDatabasePath(path: string, root: string = PROJECT_ROOT): string {
  if (path.trim() === '' || isAbsolute(path)) {
    throw new Error(`Database path must be relative to the project root, got "${path}".`);
  }
  const absolute = resolve(root, path);
  const fromRoot = relative(root, absolute);
  if (fromRoot === '' || fromRoot === '..' || fromRoot.startsWith(`..${sep}`)) {
    throw new Error(`Database path must point to a file inside the project root, got "${path}".`);
  }
  return absolute;
}
function resolveFileFormat(path: string, format?: FileFormat): FileFormat {
  if (format) return format;
  const extension = extname(path).slice(1).toLowerCase();
  if (extension === 'csv' || extension === 'json') return extension;
  throw new Error(`Cannot infer file format from "${path}". Use --format csv|json.`);
}
export function createContainer(config: AppConfig): Container {
  const db = openSqliteDatabase(resolveDatabasePath(config.databasePath));
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
