# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-05
**Project:** AI Arsenal monorepo
**State:** Issue #39 compact-record alignment implementation and independent review are complete; verification is next and no CLI product behavior is in scope.
**Current phase:** Workflow v2 compact-record alignment verification
**Active work item:** `2026-08-14-align-workflow-v2-compact-record`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Verify issue #39, the Workflow v2 compact-record alignment repair.

## Why This Is Next

- Issue #37 passed independent review, final verification, exact-SHA Quality and Portability CI, and delivery evidence recording.
- The issue #39 compact record is active in this isolated worktree; implementation evidence is recorded and the repair is bounded to Workflow v2 authorities, validators, and focused regressions.

## Open Issue Queue

1. #39 — Align current Workflow v2 compact-record skills and proportionality.
2. #24 — Make design start input requirements actionable.
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
