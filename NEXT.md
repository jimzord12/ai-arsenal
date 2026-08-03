# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-03
**Project:** AI Arsenal monorepo
**State:** The global `jz-trello-flow` installation and the mandatory agent lifecycle rule for repairing its regenerated pnpm/Bun shim are verified and delivered.
**Current phase:** Implement Trello asset documentation clarification
**Active work item:** `2026-08-03-clarify-trello-assets`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Implement the bounded Trello asset documentation clarification, then route through review and verification.

## Why This Is Next

- Work item `2026-08-03-clarify-trello-assets` records the optional Superpowers wording and intentional packed protocol-copy boundary.

## Requirements

- After any global `jz-trello-flow` lifecycle operation, agents must use `pnpm --dir <AI-Arsenal-repository-root> run repair:global-trello-shim` and complete the documented cross-shell smoke checks.

## Blockers / Escalation

- No active blocker. Live Trello mutation and package publication remain out of scope.

## Done When

- Asset wording is corrected, protocol-copy purpose is documented, and focused/package gates pass.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-08-03-remind-global-trello-shim-repair/work-item.md`
- `docs/operations/trello-work-cli-global-install.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
