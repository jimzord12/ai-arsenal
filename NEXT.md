# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** Weekly-report CLI `0.1.0` deterministic Git evidence collection is delivered, exact-SHA CI-green, and globally installed from its byte-proven private artifact.
**Current phase:** Define Trello member and owner filtering
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Use `define-monorepo-change` for native Trello card-member output/filtering and verified Work Unit owner filtering.

## Why This Is Next

- The user explicitly requested filtering cards by involved Trello member and by Work Unit metadata owner.
- Native card membership and Work Unit owner are distinct responsibilities and must remain separately observable and filterable.
- The prior weekly-report item is fully delivered and no active workflow item blocks definition.

## Requirements

- Define stable native-member identity fields and matching semantics without conflating them with metadata `owner`.
- Preserve existing list filters and fail-closed Work Unit parsing.
- Use offline Trello fixtures by default and keep live production-board mutation out of scope.
- Include the mandatory Changesets, exact-CI-green artifact, global installation, and installed-shim verification chain for CLI behavior changes.

## Blockers / Escalation

- No active blocker.
- Dangerous deletion, production Trello mutation, and registry publication are not authorized or required.

## Done When

- A compact Workflow v2 Trello filtering work item is defined and routed to focused implementation.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
