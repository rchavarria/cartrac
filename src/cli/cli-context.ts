import type { Container } from '../bootstrap.ts';

/** What commands receive: lazy access to the application and an output sink. */
export interface CliContext {
  container(): Container;
  print(text: string): void;
}
