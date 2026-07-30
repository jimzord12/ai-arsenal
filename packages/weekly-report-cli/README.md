# `@jz/ai-arsenal-weekly-report-cli`

Generic Node.js command-line boundary for deterministic weekly engineering-report evidence.

This foundation package establishes the executable, distribution, diagnostics, and exit-code contract. Evidence collectors are intentionally not included yet.

## Runtime contract

- Runtime: Node.js 24.
- Executable: `weekly-report-cli`.
- Successful command output is written to stdout.
- Diagnostics are written to stderr.
- Exit code `0` means success.
- Exit code `2` means invalid CLI usage.
- Runtime targets, credentials, orchestration, report writing, and delivery belong to the consumer rather than this package.

## Workspace usage

```sh
pnpm --filter @jz/ai-arsenal-weekly-report-cli build
node packages/weekly-report-cli/dist/bin.js --help
node packages/weekly-report-cli/dist/bin.js --version
```

The package remains private and is consumed as a verified packed artifact. Registry publication and global installation are outside the current boundary.

## Verification

```sh
pnpm --filter @jz/ai-arsenal-weekly-report-cli test
pnpm --filter @jz/ai-arsenal-weekly-report-cli test:distribution
pnpm --filter @jz/ai-arsenal-weekly-report-cli validate
```

The distribution test packs the package, installs it into a clean temporary consumer, and invokes the generated executable shim through a real process.
