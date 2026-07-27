Work item: 2026-07-26-trello-work-unit-cli
Artifact: implementation
Revision: 2
Prerequisites: contract@2,plan@2,approval@1
Status: ready

# Changed paths

- `.prettierignore`
- `NEXT.md`
- `docs/work-items/2026-07-26-trello-work-unit-cli/implementation-report.md`
- `docs/work-items/2026-07-26-trello-work-unit-cli/revisions/implementation-report.md/v1.md`
- `docs/work-items/2026-07-26-trello-work-unit-cli/revisions/verification.md/v1.md`
- `packages/trello-work-cli/package.json`
- `packages/trello-work-cli/src/checklist.ts`
- `packages/trello-work-cli/src/checklist.test.ts`
- `packages/trello-work-cli/src/reconcile.ts`
- `packages/trello-work-cli/src/reconcile.test.ts`
- `packages/trello-work-cli/src/transition.ts`
- `packages/trello-work-cli/src/transition.test.ts`
- `packages/trello-work-cli/src/update.ts`
- `packages/trello-work-cli/src/update.test.ts`

## Decisions

- Archived failed verification revision 1 and implementation revision 1 exactly as required by failed-verification recovery before repairing product files.
- Existing operation records are now evaluated before ordinary stale-version preflight; stale versions still fail before every new write.
- Metadata/description replay now verifies the complete current requested metadata, sections, and title before returning `recovered`; retained-marker drift returns partial recovery.
- Checklist fake writes advance the activity version so replay-plus-original-version tests exercise realistic remote behavior.
- Package formatting explicitly consumes the repository ignore file, and immutable work-item revision archives are excluded from root Prettier so exact historical bytes remain preserved while canonical formatting remains reproducible.

## Tests

- RED: coverage-free focused update/transition/reconcile/checklist run failed 4 suites, 6 tests, proving stale-before-replay and retained-marker drift defects.
- GREEN: the same focused run passed 4 suites, 33 tests.
- Exact focused package test followed by package format passed with generated coverage present.
- Package format, lint, typecheck, test, and strict validate passed; 15 suites and 159 tests passed.
- Root format, lint, typecheck, and test passed; Trello CLI 15 suites/159 tests and features CLI 9 suites/154 tests passed.
- Workflow tests passed: 30 tests.
- The first aggregate `validate:workflow` attempt correctly failed while recovery metadata was still intermediate because implementation revision 2 and the verification route had not yet been written; final workflow validation is run only after this report and route update.
- No live Trello access or mutation, credential loading, global install, release, publish, stage, commit, or push was performed.

## Deviations

None. `.prettierignore` is the narrow workflow-evidence preservation correction required to keep immutable superseded artifacts byte-preserved while satisfying the approved root-format gate.
