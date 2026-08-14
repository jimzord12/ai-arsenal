# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-15
**Project:** AI Arsenal monorepo
**State:** Issue #39 compact-record alignment is delivered; no CLI product behavior was in scope.
**Current phase:** No active Workflow v2 work item
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Resume issue #24, making design-start input requirements actionable.

## Why This Is Next

- Issue #39 passed independent review, final verification, exact-SHA Quality and Portability CI, and delivery evidence recording at artifact commit `c50cc4aef09b627088296ec745299f2f2537f179`.
- No Workflow v2 work item is active; its isolated branch and worktree are retained for external integration.

## Open Issue Queue

1. #24 — Make design start input requirements actionable.
2. #39 — Align current Workflow v2 compact-record skills and proportionality (delivered; PR #40 open).
3. #21 — Improve `jz-trello-flow` CLI authoring and discovery UX.

## Requirements

- Preserve the existing #24 worktree byte-for-byte.
- Keep the Linux/Ubuntu Quality coverage active.
- Investigate the underlying Windows harness compatibility separately after the Workflow v2 repair.

## Blockers / Escalation

- Issue #37 delivered at commit `f8e19b97d5ab8875adea35c637e2991d5472aa85`; PR #38 remains open for integration.

## Done When

- Issue #37 is delivered and its active registration is cleared.
- Issue #39 is independently reviewed, verified, and delivered without changing CLI behavior or issue #24's worktree.

## Source of Truth

- `AGENTS.md`
- GitHub issue #37
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `scripts/validate-monorepo-work-item.mjs`
