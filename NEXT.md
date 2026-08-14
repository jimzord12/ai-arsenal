# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-05
**Project:** AI Arsenal monorepo
**State:** Issue #37 is an isolated Workflow v2 test-harness repair in progress.
**Current phase:** Workflow v2 Windows test-harness compatibility
**Active work item:** `2026-08-14-skip-windows-quality-worktree-regression`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Deliver the reviewed and verified issue #37 candidate, then reconcile the active route.

## Why This Is Next

- The base checkout is clean and the issue has its own deterministic isolated worktree.
- The failing test is independent of the compact Workflow v2 repair and must be made an honest platform-scoped gate before that repair proceeds.

## Open Issue Queue

1. Workflow v2.1 compact-record alignment repair, after this platform-scoped baseline repair.
2. #24 — Make design start input requirements actionable.
3. #21 — Improve `jz-trello-flow` CLI authoring and discovery UX.

## Requirements

- Preserve the existing #24 worktree byte-for-byte.
- Keep the Linux/Ubuntu Quality coverage active.
- Do not change the Quality workflow or skip unrelated tests.

## Blockers / Escalation

- None.

## Done When

- The affected test skips only on Windows with a clear reason.
- Non-Windows execution remains covered.
- Review, verification, commit, push, and required CI evidence are complete.

## Source of Truth

- `AGENTS.md`
- GitHub issue #37
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `scripts/validate-monorepo-work-item.mjs`
