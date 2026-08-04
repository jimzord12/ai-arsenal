# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-05
**Project:** AI Arsenal monorepo
**State:** Issue #23 has a fresh isolated successor after the workflow release-preparation repair.
**Current phase:** Trello Flow CLI canonical Work Unit template command
**Active work item:** `2026-08-05-add-work-unit-template`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Commit and push the exact reviewed `0.8.0` candidate, require exact-SHA CI, then pack, globally replace, repair the shim, smoke every required shell, and close the item with durable evidence.

## Why This Is Next

- Workflow repair commit `68f75059bf5ff180ca24bc485de7eff4ce928788` passed exact-SHA Quality and Portability CI and now requires CLI release preparation before review.
- The predecessor exhausted four reviews before that schema existed. Its product changes may be imported, but its record, routing state, snapshots, batches, and cycle count are not reusable.

## Open Issue Queue

1. #21 — Improve `jz-trello-flow` CLI authoring and discovery UX, with child issues #22 through #27; start with #22 unless definition finds a dependency overlap with the existing #6 documentation-discovery work.
2. #6, then #7 through #10 — Existing Trello guidance and diagnostics track; #7 depends on #6, while #8 through #10 can be bundled when their shared seams justify it.
3. #11 — Guided safe-mutation helper, after the guidance/diagnostic and delivery-authority tracks are stable.
4. #5 — Parent closure after its child issues have accepted resolutions.
5. #1 — Standalone README update for the `jz-skills` package; low-priority and independent.

## Requirements

- Work only in `C:/Users/jimzord12/Documents/GitHub/ai-arsenal.worktrees/2026-08-05-add-work-unit-template` on `work/2026-08-05-add-work-unit-template`.
- Complete the Trello CLI Changeset, `pnpm version-packages`, focused checks, and `CLI release preparation` declaration before entering review.
- After any global `jz-trello-flow` lifecycle operation, run `pnpm --dir C:/Users/jimzord12/Documents/GitHub/ai-arsenal run repair:global-trello-shim` and complete the documented cross-shell smoke checks.

## Blockers / Escalation

- No active blocker. The verified `0.7.0` artifact remains the rollback while the fresh successor receives a new four-cycle review budget.

## Done When

- The predecessor's product-only diff is imported and verified without carrying its Workflow v2 control/evidence files.
- Release preparation is complete before a fresh review, and the exact reviewed/CI-green artifact completes the required local-delivery evidence chain.

## Source of Truth

- `AGENTS.md`
- GitHub issues #1, #5 through #13, #21 through #27, and #29
- `docs/work-items/2026-08-04-create-isolated-worktrees/work-item.md`
- `docs/work-items/2026-08-04-resolve-global-cli-replacement-authority/work-item.md`
- `docs/work-items/2026-08-04-enforce-workflow-v2-delivery-evidence/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
