import { type Command, Option } from 'commander';
import { FILE_FORMATS, type FileFormat } from '../../bootstrap.ts';
import type { CliContext } from '../cli-context.ts';

export function registerImportCommand(program: Command, ctx: CliContext): void {
  program
    .command('import')
    .description('Import price observations from a CSV or JSON file')
    .argument('<file>', 'file to import (columns: date,store,product,brand,unit,price,currency)')
    .addOption(
      new Option('-f, --format <format>', 'file format (default: inferred from extension)').choices(
        FILE_FORMATS,
      ),
    )
    .action(async (file: string, options: { format?: FileFormat }) => {
      const app = ctx.container();
      const result = await app.importPrices.execute(app.createImportSource(file, options.format));
      ctx.print(
        `Imported ${result.observations} price observation(s) ` +
          `(${result.newProducts} new product(s), ${result.newStores} new store(s)).`,
      );
    });
}
