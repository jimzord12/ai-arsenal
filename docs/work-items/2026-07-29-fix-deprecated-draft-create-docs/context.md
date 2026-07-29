Work item: 2026-07-29-fix-deprecated-draft-create-docs
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `NEXT.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `packages/trello-work-cli/AGENTS.md`
- `packages/trello-work-cli/assets/work-guide.md`
- Completed open-standard skill work-item verification and fresh re-review

## Repository snapshot

- Branch `master` tracks `origin/master`.
- The completed protocol and Agent Skills changes are intentionally uncommitted and must be preserved.
- No active work item existed before this request.
- The fresh re-review found one Low documentation issue: `work-guide.md` declares `draft create` preferred but recommended examples at lines 205 and 246 still use deprecated `create`.

## Risks

- A broad replacement could alter the intentional deprecated-alias documentation at lines 9 and 81–83. Only the two recommended command examples may change.
- Package docs are version-matched command guidance; command spelling must match the existing catalog.

## Open questions

None. The user explicitly required this issue to be fixed.
