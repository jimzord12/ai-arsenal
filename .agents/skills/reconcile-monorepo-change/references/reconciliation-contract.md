# Monorepo Reconciliation Contract

## Gate

Reconcile an active work item only after its current `verification.md` is
`Status: passed` and the work-item validator reports the
`reconcile-monorepo-change` route. Failed verification is never reconcilable as
complete. On a failed, missing, malformed, stale, or differently routed
verification record, stop without creating reconciliation evidence, changing
planning records, or clearing active fields.

## Current Truth

Use passed verification and every current artifact to update every affected
canonical-plan section:

- Current verified state
- User-locked requirements
- Architecture
- Phase map
- Completed, current, and future phase details
- Testing and verification
- Risks
- Open decisions
- Definition of done

The canonical plan is current truth, not a change diary. Remove obsolete
assumptions and tasks. Add, split, merge, or reorder remaining work only when
verified evidence requires it. Keep historical rationale in reconciliation
evidence, an ADR, or Git history. Make no wording-only churn when no material
fact changed; reconciliation must be idempotent.

## Risks, Decisions, and Approval

Classify discoveries as verified facts, user-locked changes, technical
corrections, new risks, scope changes, or open decisions. Carry remaining and
newly material risks forward with their required resolution. Stop and request
approval before a user-locked requirement, public behavior or persisted-schema
change, major dependency or service, material scope/cost/security/privacy/
operations change, distribution-direction change, source deletion, or user-data
action. Do not use reconciliation to grant approval, broaden scope, or begin
dependent implementation.

## Evidence

Write `reconciliation.md` before changing the canonical plan, `NEXT.md`, or
active fields. Its new artifact header is revision one with a prerequisite for
the validator-confirmed current verification revision and `Status: passed`.
Record:

```text
Resulting state:
Canonical-plan updates:
NEXT.md update:
Risks:
Next action:
```

Evidence may describe the change. The canonical plan itself must not narrate
its own diff. Never write passed reconciliation evidence for failed,
incomplete, or unobserved verification.

## 30-Second Operator View

Keep `NEXT.md` compact and suitable for a 30-second human read. Preserve its
required operator-view headings and maintain:

```text
Project
State
Current phase

Next Action
Why This Is Next
Requirements
Blockers / Approval
Done When
After This
Source of Truth
```

Rules:

- State exactly one next action, naming a skill or command when known.
- Make requirements concrete checkboxes and state blockers explicitly.
- Derive the next action from the canonical plan; never manufacture a new work
  item.
- Only after passed reconciliation evidence and planning updates, clear the
  one active registration block to `none` / `none`.
- Validate closure with `valid: true`, `nextSkill: null`, a completion status,
  and passed reconciliation, then run
  `node scripts/validate-living-workflow.mjs`.
