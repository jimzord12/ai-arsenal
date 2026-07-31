# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** Native Trello member output/filtering and distinct owner filtering passed final stable-snapshot verification and await delivery.
**Current phase:** Deliver Trello member and owner filtering
**Active work item:** `2026-07-31-filter-trello-card-members`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Use `deliver-monorepo-change` for `2026-07-31-filter-trello-card-members`.

## Why This Is Next

- Review cycle 2 repaired the consumer-identity fixture finding with neutral synthetic values.
- Final verification passed root/package gates, the packed consumer, official skill validation, privacy/diff checks, and workflow validators on the repaired bytes.
- Delivery must reconcile planning, commit and push the artifact snapshot, require exact-SHA CI, then pack and install that exact CI-green commit with rollback and independent global smoke evidence.

## Requirements

- Match native members only by exact ID or case-insensitive exact username; do not match display names or substrings.
- Preserve exact metadata-owner filtering as a separate conjunctive filter.
- Keep the change read-only and use offline Trello fixtures; do not mutate live or production boards.
- Complete the mandatory Changesets, exact-CI-green artifact, global installation, and installed-shim verification chain.

## Blockers / Escalation

- No active blocker.
- Dangerous deletion, production Trello mutation, and registry publication are not authorized or required.

## Done When

- Member and owner output/filter acceptance passes review, final verification, exact-SHA CI, artifact installation, independent global smoke, and workflow closure.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-07-31-filter-trello-card-members/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
