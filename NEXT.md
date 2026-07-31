# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** Trello Flow CLI `0.5.1` all-visible/open-card member filtering is delivered, exact-SHA CI-green, and globally installed from the byte-proven private artifact.
**Current phase:** Await the next bounded request
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Use `define-monorepo-change` for the next explicit bounded monorepo request.

## Why This Is Next

- Member filtering now returns all matching visible/open ordinary cards and Work Units while archived cards stay excluded.
- Exact metadata-owner filtering remains separate, conjunctive, and Work Unit-specific.
- Artifact commit `f4d756cd634898804850cfc20596b7f145ef7515` passed required CI; its byte-proven `0.5.1` tarball is globally installed with retained `0.5.0` rollback.

## Requirements

- Preserve the delivered member/owner responsibility boundary, exact matching semantics, and archived-card exclusion.
- Keep registry publication, production Trello mutation, and source deletion behind separate bounded work.

## Blockers / Escalation

- No active blocker.
- Dangerous deletion, production Trello mutation, and registry publication are not authorized or required.

## Done When

- A new explicit request is defined as a compact Workflow v2 work item.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-07-31-filter-all-open-trello-cards-by-member/work-item.md`
- `docs/work-items/2026-07-31-filter-trello-card-members/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
