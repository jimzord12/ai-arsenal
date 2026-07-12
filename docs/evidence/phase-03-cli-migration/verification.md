# Phase 3 Verification

## Result

Phase 3 established a self-contained CLI source and test boundary at `packages/features-cli` without changing approved public behavior or persisted schemas.

## Provenance and source preservation

- A fresh byte-size and SHA-256 inventory of all 14 top-level non-archive source files was recorded immediately before copying in `source-provenance.md`.
- Every copied file matched its source hash before package adaptation.
- The eight production modules and five source Jest suites were copied under `packages/features-cli/src/`; the source README was copied and adapted at package root.
- `archives/v1/` was not copied.
- After all Phase 3 work, all 14 source file hashes still matched the pre-copy inventory.
- The source rollback copy and archive remain available and read-only.

## Package boundary

- Production modules: `bin.ts`, `cli.ts`, `features-state.ts`, `issues-state.ts`, `milestone-state.ts`, `milestone-progress.ts`, `progress-state.ts`, and `status-scanner.ts`.
- Package-local strict TypeScript uses `moduleResolution: "Bundler"` to preserve Bun-compatible extensionless sibling imports.
- Package-local Jest 29 configuration uses a minimal transformer backed by the already pinned TypeScript compiler; no dependency was added.
- Package tests emit `coverage/`, now declared as the Turbo test output.
- ESLint retains the shared root rules, with narrow exceptions for CommonJS Jest configuration and the already-characterized fail-closed throw in a `finally` block.
- A mechanical Prettier pass was applied only to the migrated package after exact-copy provenance and parity comparison.
- Production imports use only Node built-ins and sibling modules. No absolute or runtime import targets the source checkout.
- `milestone-progress.ts` retains the public usage text `bun scripts/features-cli/milestone-progress.ts <feature-slug>` because Phase 3 freezes output; it is not a source-checkout dependency and can change only with behavior approval.

## Commands and results

- Fresh source suite before copy: exit `0`; 5 suites and 109 tests passed.
- `pnpm install --frozen-lockfile`: exit `0`; lockfile already current.
- `pnpm --filter @jz/ai-arsenal-features-cli test`: exit `0`; 6 suites and 118 tests passed, with 69.88% statement/line coverage.
- `pnpm --filter @jz/ai-arsenal-features-cli typecheck`: exit `0`.
- `pnpm --filter @jz/ai-arsenal-features-cli lint`: exit `0`.
- `pnpm check`: exit `0`; formatting, lint, strict typecheck, and all migrated tests passed through Turbo.
- Fresh source suite after migration: exit `0`; 5 suites and 109 tests passed.
- Representative source/migrated parity: command output and exit codes matched; normalized feature and issue state matched; canonical issue bytes matched.
- `scripts/verify-features-cli-parity.ps1`: exit `0`; all 14 reproducible parity comparisons matched and 0 failed.

## Deferred by phase contract

- `bin.ts` and `status-scanner.ts` remain uncovered by direct tests; black-box executable and obsolete-module review remain later-phase work.
- Package `bin`, `files`, packing, publint, clean-consumer installation, and unrelated-directory executable verification remain Phase 4.
- Real concurrent-process, stale-lock, and failure-injection hardening remain Phase 5 or later and require the existing approval boundaries.
