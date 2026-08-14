# Work Item

Work item: 2026-08-14-make-design-start-input-requirements-actionable
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-08-14T00:00:00+03:00
Max time: 90 minutes
Last time check: 2026-08-14T21:55:00+03:00
Turns since time check: 0
Review cycles: 2
Review status: passed
Review snapshot: sha256:fdcfefcbd83503924c8abe5c7101c1553bdb0774ff9cde9d6b6ee9a80a12e28c
Review batch: review-20260815-02
Review expected: ["independent-review"]
Review received: [{"reviewer":"independent-review","outcome":"passed","batchId":"review-20260815-02","snapshot":"sha256:fdcfefcbd83503924c8abe5c7101c1553bdb0774ff9cde9d6b6ee9a80a12e28c"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none
Worktree: isolated
CLI local-delivery evidence: required
CLI release preparation: {"status":"complete","package":"@jz/ai-arsenal-trello-work-cli","version":"0.8.1","manifest":"packages/trello-work-cli/package.json","changelog":"packages/trello-work-cli/CHANGELOG.md"}

## Goal

Make `jz-trello-flow design start` diagnostics and command help clearly explain the required Inbox Draft input contract and the resulting persisted In Design Work Unit state, without weakening validation.

## Non-goals

- Do not change the underlying Draft-to-In Design validation contract.
- Do not change unrelated commands or title-convention issues #31–#36.
- Do not perform live Trello mutations outside the existing approved test harness.

## Acceptance criteria

- The design-start validation error identifies required draft metadata: Inbox status and null persisted identity/timestamps.
- The diagnostic explains that `design start` derives persisted identity and changes status to In Design.
- Command help documents the expected input and resulting state.
- Focused tests cover the diagnostic and help contract.
- Required package release preparation, packed-artifact validation, CI, and global installation verification are completed under repository policy.
- Quality CI derives the isolated worktree from Git's repository root so its setup regression passes on supported test platforms.

## Implementation summary

- Updated `packages/trello-work-cli/src/design.ts` so `DESIGN_START_REQUIRES_DRAFT` explains the required Inbox draft metadata and the derived In Design result.
- Updated `packages/trello-work-cli/src/command-catalog.ts` so command help states the draft input and Trello-derived output contract.
- Updated the packaged offline guide and `trello-work-design` skill so agents receive the same Draft input contract.
- Added focused diagnostic/help/documentation assertions in `packages/trello-work-cli/src/design.test.ts`, `packages/trello-work-cli/src/cli.test.ts`, and `packages/trello-work-cli/src/docs.test.ts`.
- Fixed `.github/workflows/quality.yml` to derive the sibling worktree from Git's repository root rather than the possibly transformed `GITHUB_WORKSPACE` path. The regression test now passes on Windows/Git Bash.
- Focused package tests: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/design.test.ts src/cli.test.ts --runInBand` — 108 passed.
- Full package gates: format, typecheck, lint, 322 tests (2 skipped), and publint — passed.
- Focused workflow tests: `node --test --test-name-pattern='Quality setup frees|quality CI fetches|Quality active-worktree' scripts/validate-monorepo-work-item.test.mjs` — 3 passed.
- `git diff --check` — passed.
- Root workflow checks: package gates passed; workflow suite 145 passed, 2 skipped; living-workflow validation passed. The selected-item validator correctly remains blocked until final verification is recorded.

## Review findings and repairs

Independent review batch `review-20260814-02` passed for the fresh candidate snapshot. No Critical, High, Medium, or acceptance-related Minor findings remained.

## Final verification

Result: passed

- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-08-14-make-design-start-input-requirements-actionable --json` — exit 0; valid reviewed verify route.
- `pnpm install --frozen-lockfile` — exit 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli format` — exit 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck` — exit 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli lint` — exit 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test` — exit 0; 22 suites passed, 322 tests passed, 2 skipped.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — exit 0; strict publint passed.
- `node --test scripts/validate-monorepo-work-item.test.mjs` — exit 0; 85 tests passed.
- `node scripts/validate-living-workflow.mjs` — exit 0.
- `git diff --check` — exit 0.

The reviewed candidate passed the acceptance-focused tests, package gates, workflow suite, living-workflow validation, and whitespace validation.

## Delivery evidence

Delivery result: passed
Artifact-bearing commit: c363c853397b726efb9180f630d95a8bfa3243d6
Remote ref equality: {"ref":"origin/work/2026-08-14-make-design-start-input-requirements-actionable","sha":"c363c853397b726efb9180f630d95a8bfa3243d6","confirmed":true}
Required CI: [{"workflow":"Quality","url":"https://github.com/jimzord12/ai-arsenal/actions/runs/31846770369","sha":"c363c853397b726efb9180f630d95a8bfa3243d6","conclusion":"success"},{"workflow":"Portability","url":"https://github.com/jimzord12/ai-arsenal/actions/runs/31846770388","sha":"c363c853397b726efb9180f630d95a8bfa3243d6","conclusion":"success"}]
Package: {"name":"@jz/ai-arsenal-trello-work-cli","version":"0.8.1"}
Tarball: {"file":"jz-ai-arsenal-trello-work-cli-0.8.1.tgz","sha256":"b6917cd5948c069c0de0127fb8a7924aeaceeddfb5e797b4f18269e446e8cf90","pack":"success","contents":32}
Global replacement: {"command":"pnpm add -g C:/tmp/issue24-pack-out/jz-ai-arsenal-trello-work-cli-0.8.1.tgz","result":"success","installedPackage":"@jz/ai-arsenal-trello-work-cli","installedVersion":"0.8.1"}
Installed-shim smoke: {"version":"passed","help":"passed","featureSmoke":"passed","designStartHelp":"passed"}
Installed artifact provenance: {"artifactBytes":"confirmed","sourceTree":"not-used","globalPath":"C:/Users/jimzord12/AppData/Local/pnpm/global/v11/3aac-1a0026cdf95/node_modules/@jz/ai-arsenal-trello-work-cli"}
Rollback: {"identity":"@jz/ai-arsenal-trello-work-cli@0.8.0","ready":true,"attempted":false,"result":"not-attempted"}
Clean worktree: {"confirmed":true,"afterClosureCommit":true}

## Evidence log

- GitHub issue #24: https://github.com/jimzord12/ai-arsenal/issues/24
- Parent issue #21: https://github.com/jimzord12/ai-arsenal/issues/21
- Quality baseline failure observed on base: `Quality setup frees an already checked-out work branch before linking it`.
