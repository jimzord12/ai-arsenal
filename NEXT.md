# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-04
**Project:** AI Arsenal monorepo
**State:** Workflow v2 isolated worktree-per-item development passed final verification and awaits CI-backed delivery.
**Current phase:** Workflow v2 isolated-worktree delivery
**Active work item:** `2026-08-04-create-isolated-worktrees`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Commit and push the verified Quality CI repair, require successful Quality and Portability runs, then deliver issue #29.

## Why This Is Next

- Final stable verification passed on the fresh review-approved candidate. Required branch CI must now confirm the repaired Actions topology before closure.

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

- The user authorized a fresh review-cycle reset for the Quality CI in-use-branch repair.

## Done When

- Issue #29 passes fresh independent review, final verification, and both required CI workflows; then deliver it and route issue #21.

## Source of Truth

- `AGENTS.md`
- GitHub issues #1, #5 through #13, #21 through #27, and #29
- `docs/work-items/2026-08-04-create-isolated-worktrees/work-item.md`
- `docs/work-items/2026-08-04-resolve-global-cli-replacement-authority/work-item.md`
- `docs/work-items/2026-08-04-enforce-workflow-v2-delivery-evidence/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
