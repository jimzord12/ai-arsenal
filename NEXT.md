# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-03
**Project:** AI Arsenal monorepo
**State:** The global `jz-trello-flow` installation and its durable, fail-closed pnpm/Bun shim repair are verified and delivered.
**Current phase:** No active work item
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

No active work item. Route any new request through `orchestrate-monorepo-work`.

## Why This Is Next

- Work item `2026-08-03-investigate-global-trello-cli` is delivered with an exact pushed artifact commit and green Quality and Portability CI.

## Requirements

- Reinstalling the global package can regenerate the platform shim; use
  `pnpm run repair:global-trello-shim` from this repository afterward, then run
  the documented Git Bash, CMD, and PowerShell smoke checks.

## Blockers / Escalation

- No active blocker. Live Trello mutation remains out of scope.

## Done When

- A new bounded work item is registered when new repository work is requested.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-08-03-investigate-global-trello-cli/work-item.md`
- `docs/operations/features-cli-cutover.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
