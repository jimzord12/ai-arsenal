# Phase 7 Verification

Date: 2026-07-12

## Result

Phase 7 acceptance criteria passed. The repository is public at
`https://github.com/jimzord12/ai-arsenal`, the public `master` branch contains
the Phase 7 reconciliation, and both GitHub Actions workflows pass.

## CI verification

- Quality run [`29206475468`](https://github.com/jimzord12/ai-arsenal/actions/runs/29206475468): passed on Ubuntu/Linux. It verified the frozen install, formatting, lint, strict typecheck, 139-test coverage suite, packed artifact, and strict publint validation.
- Portability run [`29206475467`](https://github.com/jimzord12/ai-arsenal/actions/runs/29206475467): passed on Ubuntu/Linux and Windows. It ran the real-process E2E suite, including packed-artifact installation/invocation, paths with spaces and Unicode, and concurrent writer cases.
- Both workflows use the pinned Node `24.5.0`, pnpm `10.33.0`, and Bun `1.3.14` toolchain with read-only repository permissions.

## Local verification

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm validate
node scripts/validate-living-workflow.mjs
```

All commands exited `0` after the final E2E harness fix. Key output:

```text
Test Suites: 7 passed, 7 total
Tests:       139 passed, 139 total
All files:   70.36% statements/lines, 77.12% branches, 87.5% functions
publint: All good!
Living workflow validation passed.
```

## Cross-platform discovery and fix

The first public Quality run failed on Linux because the E2E harness assumed
`node_modules/corepack/dist/pnpm.js`; the setup-provided Linux `pnpm` command
does not expose that path. Commit `3acdf64` selects direct `pnpm` on Linux while
retaining the Windows Corepack workaround. The first Windows matrix run then
showed Corepack's first-download notice on stderr; commit `8004c7a` passes
`COREPACK_ENABLE_DOWNLOAD_PROMPT=0` only to pnpm child processes. The final
Linux and Windows runs pass with the strict empty-stderr assertions intact.

## Consumer and rollback verification

- The current packed `@jz/ai-arsenal-features-cli@0.0.0` artifact is installed
  in the Windows user's global pnpm environment and `features-cli --help`
  succeeds through the Bun-aware shim.
- Read-only stable `features-cli status` and legacy
  `bun scripts/features-cli/bin.ts status` commands both exit `0` in the
  primary `ics-vcr` checkout and `remote-logging-system` worktree.
- The `hotfix-bridgepos-probe`, `origin-nexi-digi-impro`, and `stage`
  worktrees mount neither `.scratch` nor `scripts/features-cli`; they are not
  CLI consumers and were not modified.
- Spec-to-Ship documentation and all five personal `jz-*` consumers use the
  stable command. No remaining personal direct `scripts/features-cli` or
  `npx tsx` invocation was found.
- All 14 recorded source SHA-256 hashes still match. The source junction,
  rollback copy, and user `.scratch` state remain intact.

## Files and external consumer updates

- `.github/workflows/quality.yml`
- `.github/workflows/portability.yml`
- `packages/features-cli/test/e2e.test.ts`
- `README.md`, `AGENTS.md`, `NEXT.md`
- `docs/operations/features-cli-cutover.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/evidence/phase-07-ci-portability-consumer-cutover/`
- `C:\Users\jimzord12\Documents\ICS\github\ics-vcr\docs\agents\workflows\spec-to-ship\implementation\README.md`
- Personal `jz-write-spec`, `jz-spec-to-milestones`, `jz-milestone-to-issues`,
  `jz-issue-to-contract`, and `jz-implement-contract` skill files where a
  direct legacy invocation existed.
