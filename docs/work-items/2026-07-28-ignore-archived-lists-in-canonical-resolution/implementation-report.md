Work item: 2026-07-28-ignore-archived-lists-in-canonical-resolution
Artifact: implementation
Revision: 2
Prerequisites: contract@1,plan@2,approval@2
Status: ready

# Changed paths

- `packages/trello-work-cli/src/board.ts`
- `packages/trello-work-cli/src/board.test.ts`
- `packages/trello-work-cli/src/list-management.ts`
- `packages/trello-work-cli/src/list-management.test.ts`
- `packages/trello-work-cli/src/cli.test.ts`
- `docs/work-items/2026-07-28-ignore-archived-lists-in-canonical-resolution/implementation-report.md`
- `NEXT.md` (pipeline-step handoff only)

## Decisions

- Retained the minimal open-only filtering at active canonical mapping and workflow initialization; Trello all-list reads, explicit list-ID reads, close replay, cleanup, and audit remain unchanged.
- Archived configured canonical IDs fail with `WORKFLOW_LIST_CLOSED` during CLI mapping validation before active handlers can read or mutate cards.
- Workflow initialization alone may create an open canonical list beside an archived namesake; ordinary explicit list creation retains its prior duplicate-name behavior.
- Added public CLI no-access/no-mutation evidence and normal-execution initialization evidence requested by independent review.

## Tests

- Original RED evidence is preserved in superseded `implementation-report@1`: 3 expected archived-list failures before production edits.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/board.test.ts src/list-management.test.ts src/cli.test.ts src/transition.test.ts`: passed, 4 suites and 95 tests.
- Added `list-management.test.ts` normal-execution regression proving one archived-only `Inbox` produces exactly one new open `Inbox` and a verified workflow result.
- Added `cli.test.ts` public-boundary regression proving an archived `Done` override returns `WORKFLOW_LIST_CLOSED` before `getCard` or `updateCard` is called for transition.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli format`: passed.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli lint`: passed.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck`: passed.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test`: passed, 19 suites with 235 passed and 2 live cases skipped.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate`: strict publint passed.
- No live credentials were loaded and no Trello, installation, publication, or Git-history mutation occurred.

## Deviations

None.
