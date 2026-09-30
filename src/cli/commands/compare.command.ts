import { type Command, Option } from 'commander';
import { OUTPUT_FORMATS, type OutputFormat } from '../../adapters/formatters/index.ts';
import type { CliContext } from '../cli-context.ts';

export function registerCompareCommand(program: Command, ctx: CliContext): void {
  program
    .command('compare')
    .description('Compare the latest price of matching products across stores')
    .argument('<query...>', 'words to look for in product name, brand or unit')
    .addOption(
      new Option('-o, --output <format>', 'output format').choices(OUTPUT_FORMATS).default('table'),
    )
    .action(async (words: string[], options: { output: OutputFormat }) => {
      const app = ctx.container();
      const rows = await app.compareProducts.execute(words.join(' '));
      ctx.print(app.createFormatter(options.output).formatComparison(rows));
    });
}
