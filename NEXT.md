# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-05
**Project:** AI Arsenal monorepo
**State:** Issue #37 is delivered; the Windows-only Quality test-harness skip is verified and CI-green.
**Current phase:** Workflow v2 Windows test-harness compatibility
**Active work item:** `2026-08-14-make-design-start-input-requirements-actionable`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Define issue #39, the Workflow v2 compact-record alignment repair.

## Why This Is Next

- Issue #37 passed independent review, final verification, exact-SHA Quality and Portability CI, and delivery evidence recording.
- The remaining Workflow v2 alignment work is independently bounded in issue #39.

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
- Issue #39 is the next workflow-repair definition action.

## Source of Truth

- `AGENTS.md`
- GitHub issue #37
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `scripts/validate-monorepo-work-item.mjs`
