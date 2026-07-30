# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** The Workflow v2 pipeline, `features-cli`, `trello-work-cli`, and the verified Node.js 24 `weekly-report-cli` foundation are represented in current planning truth. All packages remain private and non-published.
**Current phase:** Await the next explicit bounded monorepo request
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Await the next explicit bounded monorepo request.

## Why This Is Next

- The weekly-report CLI foundation passed independent review, full repository gates, strict package validation, and clean packed-consumer execution.
- The canonical plan now records the three CLI package boundaries and the current pnpm/Turborepo toolchain.
- Collector behavior and consumer integration remain separate future work.

## Requirements

- Keep public package source, fixtures, documentation, and workflow records generic and free of consumer-specific integration details or credentials.
- Preserve the verified Bun boundaries for `features-cli` and `trello-work-cli` and the Node.js 24 compiled boundary for `weekly-report-cli`.
- Keep current packages private and non-published unless later bounded work explicitly changes release policy.
- Add collector behavior or consumer integration only through separate bounded work.

## Blockers / Escalation

- No active blocker.
- Later bounded work must define its own exact behavior and verification contract.

## Done When

- A new explicit request is classified and routed through the monorepo workflow.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
