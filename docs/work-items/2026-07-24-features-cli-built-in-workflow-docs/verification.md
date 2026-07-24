Work item: 2026-07-24-features-cli-built-in-workflow-docs
Artifact: verification
Revision: 1
Prerequisites: contract@1,plan@1,implementation@1
Status: passed

# Commands

| Criterion / seam                                           | Verification command or observation                                                                                                                                         | Expected / observed result                                                                                                                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Static docs, parser, help, JSON, exact lookup              | `pnpm --filter @jz/ai-arsenal-features-cli exec jest src/workflow-docs.test.ts src/workflow-docs.current.test.ts src/cli.test.ts test/characterization.test.ts --runInBand` | Passed: 4 suites, 30 tests; nine topics, help/catalog, current/no-current, JSON errors, and existing command compatibility covered.                                                                                      |
| Read-only, portability, real Bun, clean installed consumer | `pnpm --filter @jz/ai-arsenal-features-cli exec jest test/e2e.test.ts --runInBand`                                                                                          | Passed: 1 suite, 15 tests; docs works in Unicode paths without changing state and from a clean packed consumer.                                                                                                          |
| Packed boundary                                            | `pnpm --filter @jz/ai-arsenal-features-cli pack --dry-run --json`                                                                                                           | Passed: exactly 11 files, including `src/workflow-docs.ts`; tests and fixtures excluded.                                                                                                                                 |
| Strict package validity                                    | `pnpm --filter @jz/ai-arsenal-features-cli validate`                                                                                                                        | Passed: strict publint reports `All good!`.                                                                                                                                                                              |
| Repository regression                                      | `pnpm check`                                                                                                                                                                | Passed: root formatting, lint, typecheck, all package tests (9 suites, 154 tests), workflow tests, and validators.                                                                                                       |
| Workflow validity                                          | `pnpm validate:workflow`                                                                                                                                                    | Passed: living workflow and active work-item validation succeeded.                                                                                                                                                       |
| Scope / whitespace                                         | `git status --short`, implementation report path comparison, and `git diff --check`                                                                                         | Observed only approved source, tests, package metadata, README, resume skill, work-item artifacts, and the allowed `NEXT.md` pipeline field; whitespace check passed.                                                    |
| Contract hard walls                                        | Manual review of `workflow-docs.ts`, `cli.ts`, package allowlist, and tests                                                                                                 | Docs are offline/read-only, use existing selection/progress authority, retain direct dispatch and unsupported `--docs`, add no dependencies, preserve progress JSON/schema, and state PRD/feature-review ownership gaps. |

## Exit codes

- Focused Jest command: `0`.
- E2E Jest command: `0` (executed with required Bun/pnpm subprocess permission).
- Pack dry run: `0`.
- Strict publint: `0`.
- Root check: `0`.
- Workflow validation: `0`.
- `git diff --check`: `0`.
- Manual changed-path and hard-wall observations: Not applicable.

## Observed result

The implemented docs command provides an offline overview, deterministic index/topic lookup, structured JSON, and a state-aware `docs current` wrapper around unchanged canonical progress. Every `FrontierKind` has typed guidance or an explicit no-owner stop. The packed private Bun package contains the intended 11-file boundary and clean installed invocation succeeds. Existing command behavior and schema-v2 progress behavior remain covered by the full regression suite.

## Status

Passed.

## Remaining failures

None.
