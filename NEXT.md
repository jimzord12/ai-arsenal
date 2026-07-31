# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** Trello Flow CLI `0.5.1` all-visible/open-card member filtering passed final stable-snapshot verification.
**Current phase:** Deliver all-visible/open-card member filtering
**Active work item:** `2026-07-31-filter-all-open-trello-cards-by-member`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Use `deliver-monorepo-change` for `2026-07-31-filter-all-open-trello-cards-by-member`.

## Why This Is Next

- Final root, package, workflow, packed-consumer, official-skill, live-safety, privacy, and diff gates passed.
- Read-only TestingBoard evidence returned exactly the expected ordinary card and Work Unit, with owner composition excluding the ordinary card.
- The verified `0.5.1` snapshot is ready for exact-commit Git/CI delivery and global artifact replacement.

## Requirements

- Reconcile canonical/current-state records, commit and push the verified artifact snapshot, and require exact-SHA Quality plus Windows/Linux Portability CI.
- Pack only that CI-green commit, retain the exact `0.5.0` rollback artifact, and obtain fresh confirmation immediately before global replacement.
- Verify installed package bytes, generated shim, version, and read-only TestingBoard behavior; do not publish or mutate Trello.

## Blockers / Escalation

- No active blocker.
- Dangerous deletion, production Trello mutation, and registry publication are not authorized or required.

## Done When

- Member-filter queries return all matching visible/open ordinary cards and Work Units, exact owner composition remains correct, `0.5.1` is installed from its CI-green artifact, and the work item is closed.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-07-31-filter-all-open-trello-cards-by-member/work-item.md`
- `docs/work-items/2026-07-31-filter-trello-card-members/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
