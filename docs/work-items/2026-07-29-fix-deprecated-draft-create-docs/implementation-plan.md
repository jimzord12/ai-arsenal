Work item: 2026-07-29-fix-deprecated-draft-create-docs
Artifact: plan
Revision: 1
Prerequisites: contract@1
Status: ready

# Preconditions

- Preserve completed uncommitted protocol and skill work.
- Confirm only the two deprecated recommended examples need correction.
- Record digest-bound approval before editing `work-guide.md`.

## Task 1 — Correct recommended examples

### Path

- `packages/trello-work-cli/assets/work-guide.md`

### Changes

- Replace `jz-trello-flow create --file draft.md` with `jz-trello-flow draft create --file draft.md` in the Recommended human workflow.
- Replace the deprecated creation alias with `draft create` in the matching command example.
- Do not alter the concepts/command-catalog paragraphs that intentionally document `create` as deprecated.

### Proof

- Exactly two recommended/example occurrences change.
- Preferred `draft create` examples are present.
- Deprecated alias documentation remains present.
- `pnpm exec prettier --check packages/trello-work-cli/assets/work-guide.md` passes.
- Relevant package documentation validation or package tests pass.
- `node scripts/validate-monorepo-work-item.mjs --current --json`, `node scripts/validate-living-workflow.mjs` after reconciliation, and `git diff --check` pass.

## Task 2 — Verify and reconcile

- Record implementation, independent verification, and reconciliation artifacts.
- Update canonical truth and `NEXT.md` only to resolve this documentation risk and return to the pending Git delivery decision.

## Rollback

Restore only the two example command lines to their prior bytes; preserve all protocol, skill, and work-item sources.

## Completion criteria

- All four acceptance criteria pass.
- No CLI behavior, package boundary, release, installation, Trello state, commit, or push changes.
