import { type Command, Option } from 'commander';
import { FILE_FORMATS, type FileFormat } from '../../bootstrap.ts';
import type { CliContext } from '../cli-context.ts';

export function registerExportCommand(program: Command, ctx: CliContext): void {
  program
    .command('export')
    .description('Export every stored price observation to a CSV or JSON file')
    .argument('<file>', 'destination file')
    .addOption(
      new Option('-f, --format <format>', 'file format (default: inferred from extension)').choices(
        FILE_FORMATS,
      ),
    )
    .action(async (file: string, options: { format?: FileFormat }) => {
      const app = ctx.container();
      const exporter = app.createExporter(file, options.format);
      const count = await app.exportData.execute(exporter);
      ctx.print(`Exported ${count} price observation(s) to ${exporter.description}.`);
    });
}
