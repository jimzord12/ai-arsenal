# Living Implementation Plan Workflow

## Why It Exists

AI can produce software faster than a human can retain the context behind it.

This workflow keeps the project understandable by maintaining three levels of information:

1. `NEXT.md` — the 30-second operator view.
2. `AGENTS.md` — stable rules that Codex loads automatically.
3. `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` — the full current truth.

## Core Loop

```text
Orient
→ execute one approved phase
→ verify acceptance criteria
→ reconcile discoveries into the canonical plan
→ regenerate NEXT.md
→ continue only when gates allow
```

## Skills

- `initializing-living-plan-workflow`: bootstraps or repairs the workflow.
- `executing-living-plan-phase`: executes one approved phase and requires verification/reconciliation.
- `reconciling-living-plan`: rewrites the plan and `NEXT.md` from verified reality.

## Canonical Versus Historical Information

Canonical plan:

- Current verified state.
- Current architecture.
- Remaining work.
- Current risks and decisions.

Historical evidence:

- Git history.
- Phase evidence.
- ADRs.
- Archived source plans.

The canonical plan should never become a running diary.

## 30-Second UX Test

After returning days later, ask Codex:

```text
What is going on?
```

A successful response says:

- What the project is.
- Current state.
- Exact next action.
- Requirements/blockers.
- Why that action is next.
- Whether approval is needed.

## When This Workflow Fits

Use it for:

- Multi-phase implementation.
- Research/discovery-heavy projects.
- Agent-driven execution.
- Projects where architecture and requirements evolve during implementation.
- Work that may be resumed after context is forgotten.

Do not use the full workflow for a trivial one-file change with no meaningful plan.
