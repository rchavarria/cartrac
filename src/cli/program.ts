import { Command, CommanderError } from 'commander';
import {
  type AppConfig,
  type Container,
  createContainer as defaultCreateContainer,
  defaultDatabasePath,
} from '../bootstrap.ts';
import type { CliContext } from './cli-context.ts';
import { registerCompareCommand } from './commands/compare.command.ts';
import { registerExportCommand } from './commands/export.command.ts';
import { registerImportCommand } from './commands/import.command.ts';
import { registerSearchCommand } from './commands/search.command.ts';

export interface RunOptions {
  createContainer?: (config: AppConfig) => Container;
  print?: (text: string) => void;
}

/** Runs the CLI and returns the process exit code. */
export async function run(argv: readonly string[], options: RunOptions = {}): Promise<number> {
  const createContainer = options.createContainer ?? defaultCreateContainer;
  const print = options.print ?? ((text: string) => console.log(text));
  let container: Container | undefined;

  const program = new Command()
    .name('cartrac')
    .description('Track grocery prices over time and compare them across supermarkets')
    .version('0.1.0')
    .option('--db <path>', 'SQLite database file (env: CARTRAC_DB)', defaultDatabasePath())
    .exitOverride();

  const ctx: CliContext = {
    container: () => {
      container ??= createContainer({ databasePath: program.opts<{ db: string }>().db });
      return container;
    },
    print,
  };

  registerImportCommand(program, ctx);
  registerSearchCommand(program, ctx);
  registerCompareCommand(program, ctx);
  registerExportCommand(program, ctx);

  try {
    await program.parseAsync([...argv], { from: 'user' });
    return 0;
  } catch (error) {
    if (error instanceof CommanderError) return error.exitCode;
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  } finally {
    container?.close();
  }
}
