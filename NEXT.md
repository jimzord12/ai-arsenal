# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-04
**Project:** AI Arsenal monorepo
**State:** Workflow v2 branch-per-work-item development and fail-closed CLI delivery evidence are delivered.
**Current phase:** No active work item
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Define issue #21, "Improve `jz-trello-flow` CLI authoring and discovery UX."

## Why This Is Next

- Issues #13 and #12 are delivered; issue #21 is next in the recorded dependency order.

## Open Issue Queue

1. #21 — Improve `jz-trello-flow` CLI authoring and discovery UX, with child issues #22 through #27; start with #22 unless definition finds a dependency overlap with the existing #6 documentation-discovery work.
2. #6, then #7 through #10 — Existing Trello guidance and diagnostics track; #7 depends on #6, while #8 through #10 can be bundled when their shared seams justify it.
3. #11 — Guided safe-mutation helper, after the guidance/diagnostic and delivery-authority tracks are stable.
4. #5 — Parent closure after its child issues have accepted resolutions.
5. #1 — Standalone README update for the `jz-skills` package; low-priority and independent.

## Requirements

- New Workflow v2 items use `work/<work-item-id>` branches, and active stages remain on the exact matching branch.
- After any global `jz-trello-flow` lifecycle operation, agents must use `pnpm --dir <AI-Arsenal-repository-root> run repair:global-trello-shim` and complete the documented cross-shell smoke checks.

## Blockers / Escalation

- No active blocker. This workflow-policy item does not perform a release, global replacement, or live Trello mutation.

## Done When

- Define the next bounded work item through `orchestrate-monorepo-work`; the delivered Workflow v2 policy remains validated.

## Source of Truth

- `AGENTS.md`
- GitHub issues #1, #5 through #13, and #21 through #27
- `docs/work-items/2026-08-04-resolve-global-cli-replacement-authority/work-item.md`
- `docs/work-items/2026-08-04-enforce-workflow-v2-delivery-evidence/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
