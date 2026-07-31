# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** GitHub issue #16 is delivered and closed: Workflow v2 has one reusable deterministic review-candidate snapshot calculation with focused cross-platform digest coverage.
**Current phase:** Await the next bounded request
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Use `define-monorepo-change` for GitHub issue #17, the next bounded child in the snapshot-bound review barrier.

## Why This Is Next

- Commit `6d0e7eac900ff3c418ecfdd2071ad989dcd28318` contains the verified issue-#16 implementation and matched `origin/master` after push.
- Exact-SHA Quality run `30625803324` and Portability run `30625803323` passed; Portability passed on Ubuntu and Windows.
- GitHub issue `#16` is closed as completed. Parent issue `#14` remains open, and issue `#17` is its next ordered child.

## Requirements

- Preserve issue #16's deterministic candidate calculation and issue #15's explicit lifecycle.
- Keep issue #17 bounded to complete matching review-batch evidence; validator advancement enforcement and integrated regression/documentation alignment remain owned by issues `#18` and `#19`.
- Continue through Workflow v2 rather than implementing from the issue body alone.
- Preserve issue #15's explicit lifecycle, delivered-record compatibility, five-stage route, and four-cycle limit.
- Keep review-batch semantics, validator advancement enforcement, and integrated regressions/normative documentation aligned with issues `#17`–`#19`.

## Blockers / Escalation

- No active blocker.

## Done When

- GitHub issue #17 is defined as one compact Workflow v2 work item with explicit boundaries against issues #18 and #19.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-07-31-deterministic-review-snapshot/work-item.md`
- `https://github.com/jimzord12/ai-arsenal/issues/16`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
