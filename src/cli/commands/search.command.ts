import { type Command, Option } from 'commander';
import { OUTPUT_FORMATS, type OutputFormat } from '../../adapters/formatters/index.ts';
import type { CliContext } from '../cli-context.ts';

export function registerSearchCommand(program: Command, ctx: CliContext): void {
  program
    .command('search')
    .description('Show the price history of products matching a query')
    .argument('<query...>', 'words to look for in product name, brand or size')
    .option('-s, --store <name>', 'only show prices from this store')
    .addOption(
      new Option('-o, --output <format>', 'output format').choices(OUTPUT_FORMATS).default('table'),
    )
    .action(async (words: string[], options: { store?: string; output: OutputFormat }) => {
      const app = ctx.container();
      const rows = await app.searchPrices.execute({ text: words.join(' '), store: options.store });
      ctx.print(app.createFormatter(options.output).formatPrices(rows));
    });
}
