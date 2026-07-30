# Work Item

Work item: 2026-07-30-add-weekly-report-cli-foundation
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-07-30T23:22:29+03:00
Max time: 6 hours
Last time check: 2026-07-30T23:22:29+03:00
Turns since time check: 2
Review cycles: 1
Required findings remaining: no
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Add the smallest verified Node.js 24 and TypeScript package foundation for a reusable weekly-report evidence CLI in AI Arsenal, exposing one Node-compatible executable while keeping all consumer-specific integration, delivery, credential, and private target concerns outside the public package.

## Non-goals

- Do not implement Git collection, Vercel resolution, report interpretation, scheduling, message delivery, or live service access.
- Do not copy or disclose consumer identifiers, private repository history, deployment configuration, credentials, report policy, or orchestration configuration.
- Do not change the Bun runtime or behavior of `features-cli` or `trello-work-cli`.
- Do not publish to a registry, create a release, install globally, or modify consumer repositories.
- Do not introduce a generic plugin framework, multi-project scheduler, orchestration SDK dependency, or speculative extension system.

## Acceptance criteria

- `packages/weekly-report-cli` is the private non-published package `@jz/ai-arsenal-weekly-report-cli` and exposes one `weekly-report-cli` executable.
- The package uses TypeScript with a deliberate Node.js 24-compatible build and packed-artifact boundary rather than depending on Bun or direct execution of unpackaged TypeScript.
- The executable provides deterministic help/version behavior, structured diagnostics, and stable success/usage exit-code foundations without pretending that unimplemented collectors work.
- Package scripts integrate with the existing pnpm/Turborepo format, lint, typecheck, test, build/pack, and validation graph without changing sibling CLI runtime contracts.
- Focused unit/process tests and a clean unrelated packed-consumer smoke prove the generated executable on the supported Windows and Linux boundary.
- Public source, tests, fixtures, package contents, and documentation are generic and contain no consumer project names, private integration details, credentials, private target values, or production records.
- Root package documentation and canonical planning truth identify the new package responsibility, Node runtime exception to the two Bun CLIs, and non-published distribution boundary.
- The final stable snapshot passes applicable package checks, repository checks, workflow validation, strict package validation, and whitespace checks.

## Implementation summary

- Added `packages/weekly-report-cli` as `@jz/ai-arsenal-weekly-report-cli` with a compiled Node.js 24 `weekly-report-cli` binary, honest help/version output, separated stdout/stderr diagnostics, and stable success/usage exit codes.
- Added TypeScript build configuration, focused unit and real-process tests, strict package validation, and a clean temporary-consumer packed-artifact smoke test.
- Added the root build task, Turbo build/pack graph integration, lockfile importer, and Windows/Linux portability workflow coverage without changing either Bun CLI runtime.
- Updated root and package documentation to describe the package, current foundation boundary, pinned root toolchain, and non-published packed-artifact use.
- Test-first evidence: help, aliases, version, usage failure, compiled-process, and Windows path-with-spaces seams were observed failing before their smallest production changes. Focused package format, lint, typecheck, nine tests with full statement/line/function coverage, strict publint, and packed-consumer smoke then passed.

## Review findings and repairs

- Medium: the Windows distribution harness split valid temporary paths containing spaces. Repaired by invoking `.CMD` processes through `cmd.exe call` with argument boundaries preserved and by making every distribution workspace contain spaces. The previously failing controlled `TEMP`/`TMP` case now passes.
- Medium: `--version` duplicated `0.0.0` in source and could drift after a package version change. Repaired by reading the packed package manifest as the version authority; type, process, and packed-consumer tests pass.
- Medium: initial public workflow wording named the private consumer and orchestration channels despite the generic boundary. Repaired with consumer-neutral wording and a scan of all changed public files.
- Acceptance-related Minor: root introductory documentation still described only the original Bun package. Repaired to identify both Bun CLIs, the Node.js exception, current root toolchain, and private non-published package policy.
- Canonical-plan reconciliation remains intentionally deferred to the Workflow v2 reconcile stage after verification, as routed by `NEXT.md`; changing it during review would violate the repository workflow.
- Narrow independent re-review passed with no remaining Critical, High, Medium, or acceptance-related Minor finding. It independently passed the Windows path-with-spaces packed-consumer run, confirmed manifest-derived version behavior and packed contents, found no consumer names/private integration details/credentials in changed public files, and confirmed review artifacts were cleaned.

## Final verification

Result: passed

- `pnpm build` — exit 0; Turbo discovered all four packages and built the new Node.js package.
- `pnpm check` — exit 0; root formatting, lint, type checking, package tests, workflow tests, and workflow validation passed. The new package passed 2 suites and 9 tests with full statement/line/function coverage. The root run replayed an existing Node.js `DEP0190` warning from unchanged `features-cli` code; the new package emitted no warning.
- `pnpm validate` — exit 0; 13 Turbo tasks passed and strict publint reported `All good!` for the new package.
- `pnpm --filter @jz/ai-arsenal-weekly-report-cli test:distribution` — exit 0; a clean temporary consumer installed and executed the packed CLI from a path containing spaces.
- `pnpm install --frozen-lockfile` — exit 0; all five workspace projects were already up to date under pnpm 11.7.0.
- `node scripts/validate-living-workflow.mjs` — exit 0; living workflow validation passed.
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-30-add-weekly-report-cli-foundation --json` — exit 0; valid and routed to verification on the verified snapshot.
- `git diff --check` — exit 0.
- Final changed-file and packed-artifact scan — exit 0; no consumer names, private integration details, or credential assignments found. Packed contents were exactly `README.md`, `package.json`, `dist/bin.js`, and `dist/cli.js`.
