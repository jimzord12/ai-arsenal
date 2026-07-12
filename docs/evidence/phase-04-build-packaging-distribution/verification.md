# Phase 4 Verification

## Result

Phase 4 established and verified the private npm-compatible Bun source-package contract without changing public CLI behavior, persisted schemas, consumers, or publication policy.

## Package contract

- `@jz/ai-arsenal-features-cli` remains private and declares Bun `1.3.14`.
- `bin.features-cli` targets the shebang entrypoint `src/bin.ts`.
- An empty restrictive `exports` map blocks package and deep imports; there is no TypeScript import surface.
- The explicit `files` boundary contains the eight production TypeScript modules and README; npm-compatible packing adds `package.json`.
- No bundling, standalone binary, runtime dependency, registry publication, or publication automation was added.

## Packed artifact and validation

- Pre-change `pnpm --filter @jz/ai-arsenal-features-cli pack --dry-run --json`: showed the missing executable contract and leaked tests, fixtures, coverage, Turbo logs, and package configuration.
- Post-change dry run: exit `0`; exactly 10 files were listed—`package.json`, `README.md`, and eight production modules.
- `pnpm --filter @jz/ai-arsenal-features-cli pack --json`: exit `0`; produced `jz-ai-arsenal-features-cli-0.0.0.tgz` with the same 10-file boundary.
- `tar -tf <tarball>`: exit `0`; only the 10 intended `package/` paths were present.
- `pnpm exec publint <tarball> --strict`: exit `0`; actual tarball reported `All good!`.
- `pnpm --filter @jz/ai-arsenal-features-cli validate`: exit `0`; strict publint packed with pnpm and reported `All good!`.
- A clean consumer's `bun -e` deep import of `@jz/ai-arsenal-features-cli/src/cli.ts` succeeded before the restrictive map and fails after it, while the installed executable continues to work.
- Are the Types Wrong was skipped because the package exposes no import API.

## Clean unrelated consumer

- Created a unique directory under the Windows system temporary directory and initialized an unrelated pnpm consumer.
- Installed the actual tarball with `pnpm --dir <temp-consumer> add <tarball>`: exit `0`.
- Inspected `node_modules/.bin/features-cli.CMD`: the generated Windows shim invokes `bun` from `PATH` and targets the installed `src/bin.ts`.
- Invoked installed `--help`, `init`, `create-feature sample-feature`, `update-feature sample-feature --status in-progress --phase design`, and `get-feature`: all exited `0`.
- Verified `.scratch/features-status.json` retained schema version `"2"` and the feature state `in-progress` / `design`.
- Removed the isolated temporary consumer after verification; no user workspace or `.scratch` data was used.

## Repository and source preservation

- `pnpm install --frozen-lockfile`: exit `0`; lockfile remained current.
- `pnpm check`: exit `0`; formatting, lint, strict typecheck, six suites, and all 118 tests passed with 69.88% statement/line coverage.
- `pnpm validate`: exit `0`; the Turbo test/pack/validate chain completed successfully.
- `node scripts/validate-living-workflow.mjs`: exit `0`; living workflow validation passed with all required files and a compact `NEXT.md`.
- All 14 source inventory byte sizes and SHA-256 hashes still match Phase 3 provenance.
- The rollback source `archives/v1/` remains present; no package archive directory exists.

## Discovery

- At the repository root, bare `pnpm pack` invokes pnpm's built-in root-package pack rather than the manifest's Turbo script. Root operator documentation now uses `pnpm run pack`; the package-specific filtered pack command remains correct.
- Formal automated black-box process/distribution regression coverage remains Phase 6. Phase 4 records the required real-artifact manual clean-consumer smoke.
