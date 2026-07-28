Work item: 2026-07-28-trello-cli-onboarding-fixes
Artifact: verification
Revision: 2
Prerequisites: contract@2,plan@3,implementation@2
Status: passed

# Commands

1. `git status --short` plus programmatic comparison with `implementation-report.md` and plan revision 3 affected paths — changed-path audit.
2. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/cli.test.ts` — planned result and executable CLI contract.
3. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/work-unit.test.ts src/config.test.ts src/transition.test.ts src/board.test.ts` — In Design schema, seven-list mapping, board resolution, and Ready gating.
4. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/read-commands.test.ts` — mixed Inbox classification/listing.
5. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/design.test.ts` — same-card design lifecycle, board-wide operation collision, and recovery.
6. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/create.test.ts src/cli.test.ts src/design.test.ts src/read-commands.test.ts` — draft/create alias and real command routing.
7. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/list-management.test.ts src/docs.test.ts src/config.test.ts` — seven-list initialization/diagnostics/docs.
8. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath test/live-trello.e2e.test.ts` — credential-free harness parsing/preconditions with live cases skipped.
9. Package `format`, `lint`, `typecheck`, and `test` commands.
10. Root `pnpm format`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` commands.
11. `pnpm test:workflow` and `node scripts/validate-living-workflow.mjs`.
12. `git diff --check`.
13. Repository-wide `.tgz` inventory without mutation.
14. Independent exact-snapshot review of all previous Critical/High findings.

## Exit codes

1. Not applicable; audit passed with 23 product paths, zero unreported paths, and zero paths outside plan revision 3.
2. `0` — 51 tests passed.
3. `0` — 51 tests passed.
4. `0` — 11 tests passed.
5. `0` — 8 tests passed.
6. `0` — 81 tests passed.
7. `0` — 42 tests passed.
8. `0` — 12 tests passed and 2 live tests skipped.
9. `0`, `0`, `0`, `0` — complete package suite: 19 suites, 230 passed, 2 skipped.
10. `0`, `0`, `0`, `0` — all three root Turbo tasks passed for each gate.
11. `0`, `0` — 30 workflow tests passed; living-workflow validation passed.
12. `0`.
13. Not applicable; zero `.tgz` files observed.
14. Not applicable; final reviewer reported Critical: 0, High: 0 and authorized verification.

## Observed result

- Planned metadata/description proposals render successfully.
- Ordinary Inbox cards and Draft Work Units coexist; malformed cards claiming Work Unit identity fail closed.
- Draft creation, deprecated alias warning separation, in-place design start, board-wide replay/collision safety, stale-version handling, and recovery paths passed focused tests.
- In Design uses canonical partial structure; Ready rejects Pending content and Open Questions.
- Seven-list initialization, diagnostics, docs, fixtures, and corrected workbook passed offline checks.
- The gated live harness independently establishes its seven-list precondition and uses full-card-scoped durable operation IDs with distinct completion/recovery phases; live cases remained skipped and no external system was accessed.
- Strict package validation is retained as implementation evidence and was not repeated during verification because packing is prohibited at this stage.
- Post-capture global installation and TestingBoard execution remain outside repository acceptance as approved.

## Status

Passed.

## Remaining failures

None.
