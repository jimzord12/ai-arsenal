# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-04
**Project:** AI Arsenal monorepo
**State:** Issue #12 is implementing fail-closed Workflow v2 delivery evidence after issue #13 authority alignment.
**Current phase:** Enforce Workflow v2 delivery evidence before CLI closure
**Active work item:** `2026-08-04-enforce-workflow-v2-delivery-evidence`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Implement issue #12, "Enforce Workflow V2 delivery evidence before CLI closure."

## Why This Is Next

- Issue #13 is delivered, and issue #12 is the next bounded item in the recorded dependency order.

## Open Issue Queue

1. #13 — Resolve Workflow V2 authority for routine global CLI replacement.
2. #12 — Enforce Workflow V2 delivery evidence before CLI closure (after #13).
3. #21 — Improve `jz-trello-flow` CLI authoring and discovery UX, with child issues #22 through #27; start with #22 unless definition finds a dependency overlap with the existing #6 documentation-discovery work.
4. #6, then #7 through #10 — Existing Trello guidance and diagnostics track; #7 depends on #6, while #8 through #10 can be bundled when their shared seams justify it.
5. #11 — Guided safe-mutation helper, after the guidance/diagnostic and delivery-authority tracks are stable.
6. #5 — Parent closure after its child issues have accepted resolutions.
7. #1 — Standalone README update for the `jz-skills` package; low-priority and independent.

## Requirements

- After any global `jz-trello-flow` lifecycle operation, agents must use `pnpm --dir <AI-Arsenal-repository-root> run repair:global-trello-shim` and complete the documented cross-shell smoke checks.

## Blockers / Escalation

- No active blocker. This workflow-policy item does not perform a release, global replacement, or live Trello mutation.

## Done When

- Required CLI delivery evidence is validated fail closed while ordinary non-CLI work remains exempt.

## Source of Truth

- `AGENTS.md`
- GitHub issues #1, #5 through #13, and #21 through #27
- `docs/work-items/2026-08-04-resolve-global-cli-replacement-authority/work-item.md`
- `docs/work-items/2026-08-04-enforce-workflow-v2-delivery-evidence/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
