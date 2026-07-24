---
name: executing-living-plan-phase
description: Use when a legacy instruction refers to executing a living-plan phase and the request must be redirected into the current monorepo work-item workflow.
---

# Route a Legacy Living-Plan Execution Request

## Role

This is a compatibility wrapper, not the normal executor. Do not execute a
broad phase from this skill. The normal entry point for AI Arsenal monorepo
work is `orchestrate-monorepo-work`, which reads the current state and selects
the earliest eligible stage.

## Route the Request

1. Read root and scoped `AGENTS.md` files, `NEXT.md`, the canonical-plan
   section named by `NEXT.md`, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`,
   `git status --short`, and relevant recent commits.
2. Invoke `orchestrate-monorepo-work` without changing files, Git state,
   planning records, or consumer `.scratch` data.
3. Return the router's eight-field brief and name its selected next skill. If
   the router reports structural corruption, stale approval, or malformed
   active metadata, stop at `initializing-living-plan-workflow` rather than
   beginning a phase.

## Boundaries

Do not create a work item, write an artifact, approve a plan, implement,
verify, reconcile, release, pack, publish, globally install, delete source,
or invoke `features-cli`. A request to begin or resume work is not authority to
skip the router, an approval gate, or the validator-selected stage.

For a valid no-active-item state, report the current `NEXT.md` action. Name
`capture-monorepo-change` only after the user has described a new normal-scope
monorepo change.

## Completion

Stop after the routing brief. The selected normal skill owns all subsequent
mutation and validation.
