#!/usr/bin/env bun

import { runWorkCliMain } from './cli';

runWorkCliMain(process.argv.slice(2))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`UNEXPECTED_ERROR: ${message}\n`);
    process.exitCode = 1;
  });
