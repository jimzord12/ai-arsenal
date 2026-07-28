Work item: 2026-07-28-trello-cli-onboarding-fixes
Artifact: implementation
Revision: 2
Prerequisites: contract@2,plan@3,approval@3
Status: ready

# Changed paths

- `packages/trello-work-cli/README.md`
- `packages/trello-work-cli/assets/work-guide.md`
- `packages/trello-work-cli/assets/work-unit-metadata.schema.json`
- `packages/trello-work-cli/package.json`
- `packages/trello-work-cli/src/board.test.ts`
- `packages/trello-work-cli/src/cli.test.ts`
- `packages/trello-work-cli/src/cli.ts`
- `packages/trello-work-cli/src/command-catalog.ts`
- `packages/trello-work-cli/src/config.test.ts`
- `packages/trello-work-cli/src/config.ts`
- `packages/trello-work-cli/src/design.test.ts`
- `packages/trello-work-cli/src/design.ts`
- `packages/trello-work-cli/src/docs.test.ts`
- `packages/trello-work-cli/src/list-management.test.ts`
- `packages/trello-work-cli/src/read-commands.test.ts`
- `packages/trello-work-cli/src/read-commands.ts`
- `packages/trello-work-cli/src/transition.test.ts`
- `packages/trello-work-cli/src/transition.ts`
- `packages/trello-work-cli/src/work-unit.test.ts`
- `packages/trello-work-cli/src/work-unit.ts`
- `packages/trello-work-cli/test/fixtures/valid-in-design.md`
- `packages/trello-work-cli/test/live-trello.e2e.test.ts`
- `docs/operations/trello-work-cli-onboarding-workbook.md`

## Decisions

- Planned mutation envelopes accept `proposed` alongside `plan` and `draft`.
- `In Design` is the seventh canonical list and `in_design` is the canonical partial Work Unit status. Pending content and Open Questions are allowed there; Ready rejects both.
- `work inbox list` exposes ordinary intake cards and Draft Work Units. Work Unit listing skips clearly ordinary cards but fails closed on malformed cards claiming Work Unit identity, including operation-marked cards.
- `work design start` promotes the selected Inbox card in place, preserves its identity, and checks durable operation IDs board-wide before mutation.
- `work draft create` is the explicit structured-draft entry point; `work create` remains a deprecated compatibility alias with stderr-only warning behavior.
- The gated live harness independently initializes seven-list workflow state, covers both intake paths and cleanup without running live during repository stages, and uses full-card-scoped operation IDs with distinct completion/recovery phases.
- Global installation and TestingBoard workbook execution remain the separately authorized post-capture operational follow-up.

## Tests

- RED then GREEN evidence was observed for planned `proposed` results, In Design parsing/mapping, mixed Inbox classification, same-card design start and recovery, strict Ready gating, executable command routing, board-wide cross-card operation-ID collision, malformed operation-marked cards, and live-harness preconditions/operation IDs.
- Final focused review set passed: 4 suites, 82 tests passed, 2 live tests skipped.
- Final complete package suite passed: 19 suites, 230 tests passed, 2 live tests skipped.
- Package format, lint, and strict typecheck passed.
- Root format, lint, typecheck, and test passed.
- `pnpm test:workflow` passed: 30 tests.
- `node scripts/validate-living-workflow.mjs` passed.
- `git diff --check` passed.
- Strict publint/package validation passed during implementation; generated `.tgz` files were removed and repository tarball count was verified as zero.
- Final independent exact-snapshot review reported Critical: 0, High: 0 and authorized progression to verification.

## Deviations

None.
