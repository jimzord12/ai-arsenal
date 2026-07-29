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
Escalation needed:
```

## Mandatory Workflow

```text
Execute one bounded phase autonomously
→ verify acceptance criteria
→ reconcile the canonical plan
→ update NEXT.md
→ continue only when gates allow
```

Routine gates are evidence checks, not permission prompts. A plan containing
dangerous deletion or similarly irreversible data loss requires direct user
digest authorization at Stage 5 and fresh direct confirmation again immediately
before the exact destructive operation. Escalate unavailable hard prerequisites
such as mandatory credentials/access, contradictory authority, or impossible
requirements; never mock away required live/E2E evidence merely to avoid
escalation.

Required skills:

- `initializing-living-plan-workflow`
- `executing-living-plan-phase`
- `reconciling-living-plan`

The canonical plan is current truth. `NEXT.md` is its short derived operator view.

Do not begin a next phase before reconciliation.

<!-- living-plan-workflow:end -->
