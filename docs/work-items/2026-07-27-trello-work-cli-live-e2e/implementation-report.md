Work item: 2026-07-27-trello-work-cli-live-e2e
Artifact: implementation
Revision: 11
Prerequisites: contract@3,plan@5,approval@4
Status: ready

# Repair outcome

- A matching workflow-init parent marker now establishes replay identity only; it no longer certifies completion from the first created child.
- A conflicting parent marker still returns credential-free partial collision evidence before mutation.
- Exact replay re-resolves all six requested status mappings, resumes only missing canonical-list creates with the existing deterministic child operation IDs, and verifies every final mapping against a fresh board-list read.
- A replay that completes and verifies all six mappings returns `recovered`; a fresh successful initialization or complete mutation-free no-op returns `verified`.
- A child create that remains partial or ambiguous is propagated unchanged with its deterministic child operation ID and credential-free recovery evidence.

# Strict TDD evidence

- RED: added two regressions before production edits. The focused list-management suite exited 1 with 23 passing and 2 failing tests because a parent match returned `recovered` while only `Inbox` and `Ready` existed.
- GREEN: the same sanitized focused command exited 0 with 25/25 tests passing.
- The recovery regression proves a first attempt where the first child carries the parent marker and a later child create fails, followed by exact replay that creates only missing statuses and reports `recovered` only after all six mappings are present.
- The unresolved-retry regression injects another deterministic child failure and verifies the replay remains `ambiguous` with credential-free child recovery evidence.

# Changed paths in this repair

- `packages/trello-work-cli/src/list-management.ts`
- `packages/trello-work-cli/src/list-management.test.ts`
- `docs/work-items/2026-07-27-trello-work-cli-live-e2e/implementation-report.md`
- `docs/work-items/2026-07-27-trello-work-cli-live-e2e/revisions/implementation-report.md/v10.md`
- `docs/work-items/2026-07-27-trello-work-cli-live-e2e/revisions/verification.md/v9.md`
- `docs/work-items/2026-07-27-trello-work-cli-live-e2e/verification.md` (failed current artifact archived, then removed for fresh verification)
- `NEXT.md` (pipeline-step value only)

# Sanitized verification

- Package format initially identified only `src/list-management.ts`; Prettier was applied to the two authorized list-management paths, then package format, lint, and typecheck exited 0.
- Package offline test exited 0: 18 suites passed, 207 tests passed, and 1 explicit live scenario skipped.
- Strict package validation exited 0 with publint `All good!`; no tarball remained.
- Root format, lint, and typecheck passed. The first chained aggregate invocation then encountered a transient Bun stack failure before root tests started; an immediate sanitized `pnpm test` rerun exited 0 with all package tasks successful. Root workflow tests then passed 30/30, and living-workflow validation passed.
- All test commands removed inherited `TRELLO_*` variables. No live Trello access or reconciliation occurred.

# Supersession and handoff

- Implementation@10 is archived at `revisions/implementation-report.md/v10.md` with only `Status` changed to `superseded`.
- Failed verification@9 is archived at `revisions/verification.md/v9.md` with only `Status` changed to `superseded`.
- All and only plan@5-authorized task paths, the complete active work-item directory, and the `NEXT.md` route are staged as the implementation@11 candidate; no unstaged or untracked paths remain.
- Fresh verification must inspect the exact cached snapshot, run the remaining aggregate/workflow/live gates required by plan@5, and independently review workflow-init partial replay and all contract criteria.
- No live access, reconciliation, commit, push, install, publication, or release occurred.

Deviations: None.
