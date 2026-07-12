---
name: executing-living-plan-phase
description: Use when starting or resuming work governed by NEXT.md and a canonical living implementation plan, especially after returning with limited remembered context.
---

# Executing a Living-Plan Phase

## Core Rule

Execute exactly one approved phase, verify it, reconcile the plan, then stop or continue only when the updated workflow permits it.

## Orient

1. Read `AGENTS.md`.
2. Read `NEXT.md`.
3. Read the referenced canonical-plan sections.
4. Inspect Git status and relevant recent commits.
5. Confirm the phase, prerequisites, blockers, and approval state.

When asked for status, give the six-field 30-second brief defined in `AGENTS.md`.

## Before Work

Confirm:

- The phase is the one named by `NEXT.md`.
- Required earlier approvals exist.
- Acceptance criteria are observable.
- Exact files/commands are grounded in the repository.
- User work will not be overwritten.

If the plan is materially stale before implementation, invoke `reconciling-living-plan` first.

## Execute

- Work only within the phase’s approved scope.
- Follow test-first development for behavior changes.
- Preserve user-locked requirements.
- Record discoveries as they occur.
- Stop for approval boundaries defined in `AGENTS.md`.
- Do not silently add future-phase work.

## Verify

Run the phase’s exact checks and inspect their output.

A phase is not verified by code review, confidence, or partial tests.

Record concise evidence under `docs/evidence/<phase-id>/`.

## Mandatory Reconciliation

After verification, invoke **REQUIRED SUB-SKILL:** `reconciling-living-plan`.

Do not start the next phase until:

- The canonical plan reflects the resulting system.
- Future phases incorporate discoveries.
- `NEXT.md` is current.
- Required approval is obtained.

## Blocked or Partial Phase

Reconcile material discoveries, but keep the current phase active. `NEXT.md` must show the blocker and exact recovery action.

## Completion Report

Report:

- Resulting system state.
- Verification performed.
- Plan changes.
- Current `NEXT.md` action.
- Approval needed.
