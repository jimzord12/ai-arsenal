# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** GitHub issue #18 is defined as one bounded Workflow v2 validator-enforcement work item.
**Current phase:** Deliver validator parsing, review-barrier routing, and stale-snapshot enforcement
**Active work item:** `2026-07-31-enforce-review-barrier-validation`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Use `deliver-monorepo-change` for `2026-07-31-enforce-review-barrier-validation`.

## Why This Is Next

- The no-active-item validator passed before definition, and GitHub issues `#14`, `#18`, and `#19` were refreshed from the connected repository.
- Issues #15-#17 provide the explicit lifecycle, deterministic snapshot, and complete matching batch evidence that issue #18 must now enforce.
- The compact contract resolves delivery timing without changing digest mechanics: freshness is recomputed before active delivery mutations, and newly delivered records retain valid evidence and require a clean candidate state.

## Requirements

- Commit and push the exact verified implementation snapshot, observe required exact-SHA CI, then reconcile planning truth and close issue #18.
- Preserve delivered historical compatibility and read-only validation.
- Keep issue #19's integrated lifecycle matrix and normative documentation alignment out of scope.

## Blockers / Escalation

- No active blocker.

## Done When

- The verified artifact and closure records are pushed, CI is green, issue #18 is closed, planning is reconciled to issue #19, and active registration is cleared.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-07-31-enforce-review-barrier-validation/work-item.md`
- `https://github.com/jimzord12/ai-arsenal/issues/18`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
