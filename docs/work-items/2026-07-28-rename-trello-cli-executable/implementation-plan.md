Work item: 2026-07-28-rename-trello-cli-executable
Artifact: plan
Revision: 2
Prerequisites: contract@1
Status: ready

# Preconditions

- Contract@1 is current; baseline `HEAD`, `master`, and `origin/master` are `847b246c9e483de34f5c8bd03a51dc3d48f4d10c`.
- The exact public executable rename is user-authorized. Package name and subcommands remain unchanged.
- No Trello credentials, publication, or live workbook execution are needed.
- Global reinstall is deferred until the exact commit is pushed and CI-green.

## Ordered tasks

### 1. Add focused executable-name regressions

- Paths: `packages/trello-work-cli/src/cli.test.ts`, `packages/trello-work-cli/src/docs.test.ts`, `packages/trello-work-cli/src/config.test.ts`
- Inputs: Manifest/help/docs acceptance criteria and existing package-boundary tests.
- Output: Tests requiring only `jz-trello-flow`, rejecting package-owned `work`, and expecting renamed help/docs text.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/cli.test.ts src/docs.test.ts src/config.test.ts`
- Expected result: RED before implementation due old manifest/help/docs strings, then GREEN after tasks 2–3.
- Rollback: Restore only these tests before Git delivery.

### 2. Rename the executable and shipped command text

- Paths: `packages/trello-work-cli/package.json`, `packages/trello-work-cli/src/command-catalog.ts`, `packages/trello-work-cli/src/cli.ts`, `packages/trello-work-cli/src/docs.ts`, `packages/trello-work-cli/README.md`, `packages/trello-work-cli/assets/work-guide.md`, `docs/operations/trello-work-cli-onboarding-workbook.md`
- Inputs: Exact `jz-trello-flow` name, no old alias, unchanged subcommands, and current documentation acceptance criteria.
- Output: Manifest exposes only `jz-trello-flow`; help, errors, docs, examples, and current workbook use it consistently.
- Test command: Focused Jest command from task 1 plus targeted current-path string audit.
- Expected result: Focused tests pass; no executable invocation or label remains as standalone `work` in affected current/package paths.
- Rollback: Restore only task-owned paths before Git delivery.

### 3. Generate the `0.2.0` Changesets release

- Paths: `.changeset/trello-flow-executable.md`, `packages/trello-work-cli/package.json`, `packages/trello-work-cli/CHANGELOG.md`
- Inputs: Breaking executable rename from package `0.1.0`, private-package Changesets configuration.
- Output: One minor release to `0.2.0`, generated changelog entry, and consumed temporary changeset.
- Test command: Validate pre-application Changesets status JSON, run `pnpm version-packages`, assert version `0.2.0` and consumed changeset.
- Expected result: Only Trello CLI versions to `0.2.0`; changelog documents replacement of `work` by `jz-trello-flow`.
- Rollback: Restore metadata/changelog before Git delivery.

### 4. Verify, review, reconcile, and deliver

- Paths: `docs/work-items/2026-07-28-rename-trello-cli-executable/implementation-report.md`, `verification.md`, `reconciliation.md`, `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`, `NEXT.md`, and all task-owned paths above.
- Inputs: Exact diff, package/root gates, independent review, Git/CI authority, and post-CI install boundary.
- Output: Passed work item, exact commit on remote `master`, green Quality/Portability CI, exact `0.2.0` tarball globally installed, new native Windows shim working, old package-owned shim absent.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli format && pnpm --filter @jz/ai-arsenal-trello-work-cli lint && pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck && pnpm --filter @jz/ai-arsenal-trello-work-cli test && pnpm --filter @jz/ai-arsenal-trello-work-cli validate && pnpm check && node scripts/validate-monorepo-work-item.test.mjs && node scripts/validate-living-workflow.mjs && git diff --check`
- Expected result: All gates and review pass; exact commit is CI-green; global `0.2.0` installation passes `cmd.exe /c "jz-trello-flow --help"`; the old package-owned `work` shim no longer exists.
- Rollback: Before push restore task-owned paths; after push use a normal revert; after install reinstall exact `0.1.0` tarball only if rollback is needed.

## Affected paths

### Create

- Temporary `.changeset/trello-flow-executable.md` (consumed)
- Work-item implementation, verification, and reconciliation artifacts

### Modify

- `packages/trello-work-cli/package.json`
- `packages/trello-work-cli/CHANGELOG.md`
- `packages/trello-work-cli/src/command-catalog.ts`
- `packages/trello-work-cli/src/cli.ts`
- `packages/trello-work-cli/src/docs.ts`
- `packages/trello-work-cli/src/cli.test.ts`
- `packages/trello-work-cli/src/docs.test.ts`
- `packages/trello-work-cli/src/config.test.ts`
- `packages/trello-work-cli/README.md`
- `packages/trello-work-cli/assets/work-guide.md`
- `docs/operations/trello-work-cli-onboarding-workbook.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `NEXT.md`

### Delete

- Temporary changeset through Changesets application

## Verification commands

- Focused Jest command — RED then GREEN executable-name coverage.
- Package format/lint/typecheck/test/validate chain — all pass.
- `pnpm check` and workflow validators — all pass.
- Current-path string audit and packed-manifest inspection — only `jz-trello-flow` is public.
- `git diff --check` and independent review — clean and no blocking findings.
- Git/GitHub CLI checks — exact commit remote and required CI green.
- Exact tarball global install plus native Windows help and old-shim absence — pass without Trello access.

## Rollback

Restore task-owned files before push; use a normal revert after push; reinstall the exact prior `0.1.0` tarball only if global rollback is required. Never publish, rewrite shared history, or mutate Trello.
