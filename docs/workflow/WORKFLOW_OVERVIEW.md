# Monorepo Work-Item Pipeline

## Purpose

Workflow v2 routes each bounded monorepo change through one compact
`work-item.md`. It keeps durable definition, implementation, review, final
verification, and delivery evidence without replacing consumer
`.scratch/features/` work.

## Normal Route

Start with the read-only `orchestrate-monorepo-work` router. New work follows:

```text
define → implement → review/repair → verify → deliver
```

The writing skills are `define-monorepo-change`, `implement-monorepo-change`,
`review-monorepo-change`, `verify-monorepo-change`, and
`deliver-monorepo-change`. Definition creates the clean-checkout branch
`work/<work-item-id>` in the isolated sibling worktree
`<repository-parent>/<repository-name>.worktrees/<work-item-id>`; every active
stage stays on that exact registered worktree and branch. Definition provisions
it from a clean non-work base checkout, then writes its active route only there;
the base stays `none` / `none`. Delivery pushes but does not merge, delete, or
remove branches/worktrees. Removing a worktree is dangerous deletion and needs
direct confirmation. The normative contract is
[`MONOREPO_WORK_ITEM_PIPELINE.md`](MONOREPO_WORK_ITEM_PIPELINE.md).

## Resume, Stops, and Repair

`NEXT.md` records one active work item and its current pipeline step. Awaiting
direct approval for dangerous work, an unavailable hard prerequisite, and four
exhausted repair/re-review cycles are intentional valid stopped states. They do
not route to structural repair.

Missing, malformed, duplicated, or inconsistent workflow metadata routes to
`initializing-living-plan-workflow`. That skill repairs confirmed structure
without inventing approval, prerequisites, or intent, then returns to the
router.

## Completion and Legacy Compatibility

Final verification records an explicit passed result before delivery.
`deliver-monorepo-change` reconciles current planning truth, reruns only checks
invalidated by its delivery edits, clears active registration, and performs the
bounded Git delivery.

Historical v1 directories without `work-item.md` remain validator-readable.
New work never uses the v1 artifact chain. The compatibility skills
`executing-living-plan-phase` and `reconciling-living-plan` do not replace the
normal v2 route.
