Work item: 2026-07-28-ignore-archived-lists-in-canonical-resolution
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Goal

Make every active canonical Trello workflow operation resolve and target only open canonical lists while retaining archived-list visibility and explicit ID-based recovery/audit behavior.

## Non-goals

- Do not globally filter archived lists from `TrelloClient.listBoardLists`, `work lists list`, or audit/cleanup reads.
- Do not change Trello board selection, Work Unit schema, status names, transition graph, operation-record format, package distribution, credentials, or live harness scope.
- Do not mutate Trello, retry the onboarding workbook, install globally, publish, access another board, or delete source during this work item.
- Do not add unrelated list-management refactors or generalized filtering infrastructure.

## Hard walls

- Use the repository's normal monorepo work-item pipeline and follow its approval, TDD, independent review, Git, credential, and TestingBoard boundaries.
- Preserve the intentionally modified and uncommitted `NEXT.md` continuation while creating this work item.
- Verify live repository, Git, remote, workflow registration, and relevant Trello state rather than assuming the handoff is current.
- Do not globally hide archived lists in the Trello client.
- Never mutate another Trello board; live access remains restricted to TestingBoard `6a16bbf1fea5389eb39636b7`.
- Do not create Trello cards or lists, retry the live workbook, reinstall globally, publish, access a production board, or delete source as part of this fix before the required repository capture, review, commit, push, CI, and exact-package gates complete.
- Do not continue into the live retry during this bounded repository fix.

## Acceptance criteria

- With one open canonical list and one archived exact-name namesake, active name-based mapping resolves the open list without ambiguity.
- With two open exact-name canonical lists, active mapping and initialization fail as ambiguous before any write.
- With only archived exact-name namesakes, workflow initialization reports the canonical status missing in dry-run and can create a new open canonical list in normal execution without treating the archived namesake as a duplicate.
- Explicit archived-list ID reads and list-close replay/recovery remain supported, and list/audit output still includes open and archived lists.
- Active configured canonical mappings reject archived list IDs before card placement or transition mutation.
- Every card creation, design placement, and status transition routed through canonical mappings can target only an open list.
- Existing open-list behavior, wrong-board protection, operation replay, cleanup verification, and diagnostics remain compatible.
- No live Trello mutation, package/global installation, publication, or source deletion occurs in this work item.

## Test seams

- Pure canonical mapping with open/archived namesakes, two open duplicates, archived-only namesakes, and explicit overrides.
- Workflow initialization dry-run and write paths with archived-only canonical namesakes and open duplicates.
- List creation duplicate detection where an archived namesake exists during guarded canonical initialization, while ordinary explicit list creation behavior remains unchanged unless required by initialization.
- Public command/handler paths for card placement and transition after canonical mapping resolution, proving archived overrides or archived targets fail before mutation.
- Explicit `getList`, close replay, managed-list listing, and cleanup/audit behavior with archived lists.
- Existing package and repository quality, workflow validation, and packed-boundary checks.

## Verification

- TDD evidence: each regression is run first and fails for the archived-list defect before production edits, then passes after the minimal fix.
- Focused package evidence: relevant `board`, `list-management`, command/placement, transition, and recovery tests pass without credentials or live access.
- Package gates: formatting, linting, strict typechecking, full offline Jest coverage suite, and strict publint validation pass.
- Repository gates: root formatting, linting, typechecking, tests/checks, monorepo workflow tests, work-item validation, and `git diff --check` pass on the final snapshot.
- Independent review: a fresh reviewer finds no blocking correctness, security, scope, or archived-recovery regression on the exact frozen snapshot.
- Git/CI evidence: after approved implementation and review, the bounded change is committed and pushed, `origin/master` contains the commit, and required GitHub Actions are green before any later installation or live retry.
- Safety evidence: changed paths are attributable to this work item, credentials are not persisted, and no Trello mutation or out-of-scope distribution action occurred.

## Approval required

Yes. The plan implementation changes active public CLI behavior and must receive the pipeline's later explicit digest-bound approval before product or test files are edited.
