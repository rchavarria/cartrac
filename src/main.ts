#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
import { run } from './cli/program.ts';

process.exitCode = await run(process.argv.slice(2));
