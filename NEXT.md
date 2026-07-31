# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** GitHub issue #15 is defined as the active bounded Workflow v2 review-lifecycle change.
**Current phase:** Deliver explicit review lifecycle schema and transitions
**Active work item:** `2026-07-31-model-workflow-review-lifecycle`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Use `deliver-monorepo-change` for `2026-07-31-model-workflow-review-lifecycle`.

## Why This Is Next

- The no-active-item validator passed before definition, and the worktree was clean at `c6303bb`.
- GitHub issue `#15` is the first dependency in parent issue `#14` and owns only explicit review lifecycle fields and transitions.
- The current compact template initializes implicit success with `Required findings remaining: no`; the bounded change replaces that representation while preserving delivered history.

## Requirements

- Preserve the five-stage Workflow v2 route and four-cycle review limit.
- Keep deterministic digest computation, complete review-batch semantics, the full advancement barrier, and integrated regression/documentation work in GitHub issues `#16` through `#19`.
- Keep already-delivered compact records readable without rewriting them solely for schema adoption.

## Blockers / Escalation

- No active blocker.

## Done When

- Reconcile canonical planning truth, commit and push the exact verified workflow snapshot, record delivery evidence, and clear the active registration.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-07-31-model-workflow-review-lifecycle/work-item.md`
- `https://github.com/jimzord12/ai-arsenal/issues/15`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
