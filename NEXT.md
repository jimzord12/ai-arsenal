# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-04
**Project:** AI Arsenal monorepo
**State:** Workflow v2 isolated worktree-per-item development is delivered; Trello Flow authoring and discovery UX is next.
**Current phase:** Trello Flow CLI authoring and discovery UX
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Define the first bounded child of issue #21, starting with issue #22 unless definition finds a dependency overlap with issue #6.

## Why This Is Next

- Issue #29 is closed after its exact branch commit passed fresh independent review, final verification, Quality CI, and Windows/Linux Portability CI. Issue #21 is the next queued product track.

## Open Issue Queue

1. #21 — Improve `jz-trello-flow` CLI authoring and discovery UX, with child issues #22 through #27; start with #22 unless definition finds a dependency overlap with the existing #6 documentation-discovery work.
2. #6, then #7 through #10 — Existing Trello guidance and diagnostics track; #7 depends on #6, while #8 through #10 can be bundled when their shared seams justify it.
3. #11 — Guided safe-mutation helper, after the guidance/diagnostic and delivery-authority tracks are stable.
4. #5 — Parent closure after its child issues have accepted resolutions.
5. #1 — Standalone README update for the `jz-skills` package; low-priority and independent.

## Requirements

- New Workflow v2 items use `work/<work-item-id>` in `<repository-parent>/<repository-name>.worktrees/<work-item-id>`; active stages remain in that exact registered worktree and branch.
- After any global `jz-trello-flow` lifecycle operation, agents must use `pnpm --dir <AI-Arsenal-repository-root> run repair:global-trello-shim` and complete the documented cross-shell smoke checks.

## Blockers / Escalation

- None.

## Done When

- The next bounded issue under #21 is defined in its own deterministic isolated worktree.

## Source of Truth

- `AGENTS.md`
- GitHub issues #1, #5 through #13, #21 through #27, and #29
- `docs/work-items/2026-08-04-create-isolated-worktrees/work-item.md`
- `docs/work-items/2026-08-04-resolve-global-cli-replacement-authority/work-item.md`
- `docs/work-items/2026-08-04-enforce-workflow-v2-delivery-evidence/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
