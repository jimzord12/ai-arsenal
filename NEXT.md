# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** The legacy Features CLI rollback junction is retired; the global private package and packed artifacts remain the stable and rollback routes.
**Current phase:** Review and verify the legacy Features CLI junction retirement
**Active work item:** `2026-08-01-retire-source-cli`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Resolve the final formatting-gate failure without exceeding the four-cycle
review limit, then complete verification and delivery for the verified legacy
Features CLI junction retirement.

## Why This Is Next

- The user completed the approved external removal and current read-only checks
  confirm that only the junction is absent.
- The global pnpm environment still exposes `@jz/ai-arsenal-features-cli@0.3.0`
  through the generated `features-cli` shim; both consumer status checks pass.

## Requirements

- Preserve the packaged-artifact rollback route; do not recreate a legacy source
  junction or change consumer `.scratch` data, the monorepo package, or the
  global installation.

## Blockers / Escalation

- `pnpm format:check` reports mechanical formatting issues in the canonical
  plan and active work item after the fourth review cycle; the current review
  limit prevents an unreviewed repair.

## Done When

- Current-truth records describe the retired junction and packaged rollback.
- Review, final verification, delivery, and exact-SHA CI evidence are complete.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-08-01-retire-source-cli/work-item.md`
- `docs/operations/features-cli-cutover.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
