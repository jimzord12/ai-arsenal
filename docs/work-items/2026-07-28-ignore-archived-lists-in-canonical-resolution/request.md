Work item: 2026-07-28-ignore-archived-lists-in-canonical-resolution
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Fix active canonical Trello workflow resolution so archived lists are ignored for name-based mapping, initialization, diagnostics, card placement, and transitions, without globally hiding archived lists from explicit ID-based reads, close replay, cleanup verification, or audit.

## Desired outcome

Active canonical workflow behavior resolves an open list when an archived namesake exists, remains ambiguous for two open namesakes, can plan or create a new open canonical list when only archived namesakes exist, preserves explicit archived-ID recovery, and never targets archived lists during transitions.

## Constraints

- Use the repository's normal monorepo work-item pipeline and follow its approval, TDD, independent review, Git, credential, and TestingBoard boundaries.
- Preserve the intentionally modified and uncommitted `NEXT.md` continuation while creating this work item.
- Verify live repository, Git, remote, workflow registration, and relevant Trello state rather than assuming the handoff is current.
- Do not globally hide archived lists in the Trello client.
- Never mutate another Trello board; live access remains restricted to TestingBoard `6a16bbf1fea5389eb39636b7`.
- Do not create Trello cards or lists, retry the live workbook, reinstall globally, publish, access a production board, or delete source as part of this fix before the required repository capture, review, commit, push, CI, and exact-package gates complete.
- Do not continue into the live retry during this bounded repository fix.

## User-provided context

- The prior live retry stopped before creating cards or lists.
- TestingBoard was reported to have zero cards on open lists, one active `Done`, and one archived legacy `Done`.
- The last reported repository state had `master`, `HEAD`, and `origin/master` equal at `e8d5bc2f6808ac3146f487998283444d94533e87`.
- Required regressions cover open plus archived namesake resolution, two open namesakes remaining ambiguous, archived-only initialization, explicit archived-ID recovery, and transition targeting.
- No unanswered questions were supplied.
