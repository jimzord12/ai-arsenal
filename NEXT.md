# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-14
**Project:** AI Arsenal monorepo
**State:** Issue #24 implementation is active in its isolated Workflow v2 worktree.
**Current phase:** Trello Flow CLI authoring and discovery UX
**Active work item:** `2026-08-14-make-design-start-input-requirements-actionable`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Implement issue #24 with focused RED/GREEN tests, then complete the required CLI release and review gates.

## Why This Is Next

- GitHub issue #24 is the next independently reviewable child of issue #21.
- The work item is provisioned on the exact deterministic isolated branch/worktree required by Workflow v2.
- The base checkout remains clean and inactive.

## Open Issue Queue

1. #24 — Make design start input requirements actionable.
2. #25 through #27 — Remaining authoring/discovery UX children.
3. #31 through #36 — Work Unit title-convention follow-ups.
4. #6 through #11 — Existing Trello guidance and diagnostics track.
5. #1 — Standalone README update for the `jz-skills` package.

## Requirements

- New Workflow v2 items use their own deterministic isolated worktree.
- CLI behavior work requires Changesets/SemVer, packed-artifact validation, CI, global replacement, and installed-shim smoke verification.
- Preserve globally installed `jz-trello-flow` `0.8.0` until the new release is CI-green.

## Blockers / Escalation

- Existing base Quality gate failure: branch/worktree setup regression test.
- No hard prerequisite blocker for issue #24 implementation.

## Done When

- Issue #24 acceptance criteria pass.
- Required independent review, verification, release, CI, installation, and current-truth reconciliation pass.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-08-14-make-design-start-input-requirements-actionable/work-item.md`
- GitHub issues #21 and #24
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
