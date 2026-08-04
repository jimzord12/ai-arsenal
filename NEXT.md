# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-05
**Project:** AI Arsenal monorepo
**State:** Issue #23 is delivered as globally installed private `jz-trello-flow` `0.8.0`.
**Current phase:** Trello Flow CLI authoring and discovery UX
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Define issue #24, "Make design start input requirements actionable."

## Why This Is Next

- Issue #23's fresh successor passed one complete independent review batch, final verification, exact-SHA Quality and Portability CI, clean-consumer validation, global replacement, installed-byte proof, and cross-shell smoke.
- Issue #24 is the next independently reviewable child of issue #21.

## Open Issue Queue

1. #21 — Improve `jz-trello-flow` CLI authoring and discovery UX, with child issues #22 through #27; start with #22 unless definition finds a dependency overlap with the existing #6 documentation-discovery work.
2. #6, then #7 through #10 — Existing Trello guidance and diagnostics track; #7 depends on #6, while #8 through #10 can be bundled when their shared seams justify it.
3. #11 — Guided safe-mutation helper, after the guidance/diagnostic and delivery-authority tracks are stable.
4. #5 — Parent closure after its child issues have accepted resolutions.
5. #1 — Standalone README update for the `jz-skills` package; low-priority and independent.

## Requirements

- New Workflow v2 items start from the clean base checkout and use their own deterministic isolated worktree.
- After any global `jz-trello-flow` lifecycle operation, run the documented shim repair and Git Bash, CMD, and PowerShell smoke checks.

## Blockers / Escalation

- No active blocker. Exact `0.7.0` remains the verified rollback for installed `0.8.0`.

## Done When

- Define issue #24 through Workflow v2 before changing CLI behavior.
- Preserve globally installed `0.8.0` until issue #24's separately reviewed release is CI-green.

## Source of Truth

- `AGENTS.md`
- GitHub issues #1, #5 through #13, #21 through #27, and #29
- `docs/work-items/2026-08-04-create-isolated-worktrees/work-item.md`
- `docs/work-items/2026-08-04-resolve-global-cli-replacement-authority/work-item.md`
- `docs/work-items/2026-08-04-enforce-workflow-v2-delivery-evidence/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
