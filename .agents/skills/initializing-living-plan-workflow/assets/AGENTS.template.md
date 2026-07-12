# Project Agent Operating Guide

<!-- living-plan-workflow:start -->

## Resume Contract

On every session, read:

1. `NEXT.md`
2. The referenced sections of `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
3. Git status and relevant recent commits

For a status question, answer:

```text
Project:
Current state:
Next action:
Requirements/blockers:
Why this is next:
Approval needed:
```

## Mandatory Workflow

```text
Execute one approved phase
→ verify acceptance criteria
→ reconcile the canonical plan
→ update NEXT.md
→ continue only when gates allow
```

Required skills:

- `initializing-living-plan-workflow`
- `executing-living-plan-phase`
- `reconciling-living-plan`

The canonical plan is current truth. `NEXT.md` is its short derived operator view.

Do not begin a next phase before reconciliation.

<!-- living-plan-workflow:end -->
