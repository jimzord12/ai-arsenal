# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-04
**Project:** AI Arsenal monorepo
**State:** Workflow v2 isolated worktree-per-item development is delivered; Trello Flow authoring and discovery UX is next.
**Current phase:** Trello Flow CLI authoring and discovery UX
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Define issue #23, "Add a canonical Work Unit template command."

## Why This Is Next

- Issue #29 is closed after independent review, final verification, and Quality plus Windows/Linux Portability CI; its isolated-worktree policy now governs new items.
- Issue #22 is delivered as private `jz-trello-flow` `0.7.0`; issue #23 is the next independently reviewable child of issue #21.

## Open Issue Queue

1. #21 — Improve `jz-trello-flow` CLI authoring and discovery UX, with child issues #22 through #27; start with #22 unless definition finds a dependency overlap with the existing #6 documentation-discovery work.
2. #6, then #7 through #10 — Existing Trello guidance and diagnostics track; #7 depends on #6, while #8 through #10 can be bundled when their shared seams justify it.
3. #11 — Guided safe-mutation helper, after the guidance/diagnostic and delivery-authority tracks are stable.
4. #5 — Parent closure after its child issues have accepted resolutions.
5. #1 — Standalone README update for the `jz-skills` package; low-priority and independent.

## Requirements

- New Workflow v2 items use `work/<work-item-id>` in `<repository-parent>/<repository-name>.worktrees/<work-item-id>`; active stages remain in that exact registered worktree and branch.
- After any global `jz-trello-flow` lifecycle operation, agents must use `pnpm --dir <AI-Arsenal-repository-root> run repair:global-trello-shim` and complete the documented cross-shell smoke checks.

## Blockers / Escalation

- No active blocker. Issue #23 is a new bounded CLI behavior item and will require the complete private-release, exact-artifact, CI, global-replacement, and cross-shell installed-shim evidence chain.

## Done When

- Define issue #23 through Workflow v2 in its own deterministic isolated worktree before changing CLI behavior.
- The delivered `0.7.0` package remains globally installed from its CI-green tarball, with the verified `0.6.0` artifact retained as rollback.

## Source of Truth

- `AGENTS.md`
- GitHub issues #1, #5 through #13, #21 through #27, and #29
- `docs/work-items/2026-08-04-create-isolated-worktrees/work-item.md`
- `docs/work-items/2026-08-04-resolve-global-cli-replacement-authority/work-item.md`
- `docs/work-items/2026-08-04-enforce-workflow-v2-delivery-evidence/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
