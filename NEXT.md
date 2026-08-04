# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-04
**Project:** AI Arsenal monorepo
**State:** Workflow v2 repair is active for the `jz-trello-flow` `0.7.0` delivery-evidence validator.
**Current phase:** Actual pnpm tarball identity repair
**Active work item:** `2026-08-04-add-trello-command-help`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Repair exact scoped-package tarball identity validation for the `jz-trello-flow` `0.7.0` delivery record.

## Why This Is Next

- The exact pnpm tarball is `jz-ai-arsenal-trello-work-cli-0.7.0.tgz`, but the delivery validator incorrectly requires a filename retaining the npm scope marker (`@`).

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

- No external blocker. The CI-green artifact, global replacement, installed-shim smoke, provenance, and rollback are complete; closure is blocked only by the validator's scoped-package filename defect.

## Done When

- Repair and re-verify the exact pnpm scoped-package tarball filename contract, then close the already delivered `0.7.0` release evidence.
- Define issue #23 only after this active item closes.

## Source of Truth

- `AGENTS.md`
- GitHub issues #1, #5 through #13, and #21 through #27
- `docs/work-items/2026-08-04-resolve-global-cli-replacement-authority/work-item.md`
- `docs/work-items/2026-08-04-enforce-workflow-v2-delivery-evidence/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
