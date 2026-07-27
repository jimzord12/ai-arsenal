Work item: 2026-07-26-trello-work-unit-cli
Artifact: verification
Revision: 2
Prerequisites: contract@2,plan@2,implementation@2
Status: passed

# Commands

| Source / criterion               | Command or observation                                                                                                                                        | Actual result                                                                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow preflight               | `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-26-trello-work-unit-cli --json`                                                             | Exit 0; `valid: true`, route `verify-monorepo-change`.                                                                                                                                                                                                           |
| Focused recovery suite           | `pnpm exec jest --runInBand --coverage=false --runTestsByPath src/update.test.ts src/transition.test.ts src/reconcile.test.ts src/checklist.test.ts`          | Exit 0; 4 suites, 33 tests passed.                                                                                                                                                                                                                               |
| Exact plan-style focused suite   | `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/update.test.ts src/transition.test.ts src/reconcile.test.ts src/checklist.test.ts` | Exit 0; 4 suites, 33 tests passed with coverage generated.                                                                                                                                                                                                       |
| Package format after coverage    | `pnpm --filter @jz/ai-arsenal-trello-work-cli format`                                                                                                         | Exit 0 immediately after coverage generation.                                                                                                                                                                                                                    |
| Root format after coverage       | `pnpm format:check`                                                                                                                                           | Exit 0. Immutable revision archives were excluded, not rewritten.                                                                                                                                                                                                |
| Aggregate lint                   | `pnpm lint`                                                                                                                                                   | Exit 0; 3/3 package tasks passed.                                                                                                                                                                                                                                |
| Aggregate typecheck              | `pnpm typecheck`                                                                                                                                              | Exit 0; 3/3 package tasks passed.                                                                                                                                                                                                                                |
| Aggregate tests                  | `pnpm test`                                                                                                                                                   | Exit 0; Trello CLI 15 suites/159 tests and features CLI 9 suites/154 tests passed.                                                                                                                                                                               |
| Workflow tests                   | `pnpm test:workflow`                                                                                                                                          | Exit 0; 30 tests passed.                                                                                                                                                                                                                                         |
| Living workflow                  | `node scripts/validate-living-workflow.mjs`                                                                                                                   | Exit 0.                                                                                                                                                                                                                                                          |
| Whitespace/index                 | `git diff --check && git diff --cached --check`                                                                                                               | Exit 0; no staged files.                                                                                                                                                                                                                                         |
| Replay/version ordering          | Independent source and executable review of update, transition, reconcile, and all checklist mutation families                                                | Passed. Durable records are checked first; exact original-version replay recovers with zero writes; changed requests collide; stale versions reject before every new write.                                                                                      |
| Update replay postcondition      | Independent retained-marker drift review and focused tests                                                                                                    | Passed. Replay checks title, all metadata except invocation-managed `updated_at`, and every section; retained-marker drift returns partial recovery.                                                                                                             |
| Formatting/evidence preservation | Coverage-generation followed by package/root formatting; SHA-256 of superseded verification v1                                                                | Passed. Superseded verification v1 remained `2dcc79a841673369f156dfe5d8250f9b9ddc5c9ed7b6f030918543a61b208976`.                                                                                                                                                  |
| Candidate stability              | Sorted SHA-256 manifest before/after independent review                                                                                                       | Passed: 56 files; reviewer-reproduced digest `0d091dd80d4516fee46147e11ffc7153e6de9b3d4e8441ebde5f5ec480f82c72` unchanged. The implementer-supplied digest used a non-reproducible recipe; this was provenance-only and not candidate drift.                     |
| Safety/security                  | Independent source and secret/API boundary inspection                                                                                                         | Passed. No live Trello access, ambient credential loading, mutation, staging, commit, push, release, distribution pack, or global installation. API secret is not sent; writes are not retried; mutation bodies are form encoded; key/token values are redacted. |

## Exit codes

- Workflow preflight: `0`.
- Both focused test commands: `0`.
- Package and root formatting: `0`.
- Root lint, typecheck, test, workflow test, and living-workflow validation: `0`.
- Diff checks: `0`.
- Manual observations: Not applicable.

## Observed result

A fresh independent Hermes reviewer found no remaining Critical or High correctness, security, scope, secret, or API findings. The two failed-verification semantic defects are corrected, the formatting sequence is reproducible, all required package/root gates pass, and immutable failed-attempt evidence remains preserved. Only a non-blocking manifest-recipe provenance discrepancy remains; the reviewer disclosed a stable reproducible digest over the unchanged 56-path inventory.

## Status

Passed.

## Remaining failures

None.
