---
name: reconciling-living-plan
description: Use when a plan phase has passed verification or implementation discoveries materially invalidate the current or future canonical living plan.
---

# Reconciling the Living Plan

## Goal

Make the canonical plan and `NEXT.md` match verified project reality without turning the plan into a change diary.

## Inputs

Read:

- `AGENTS.md`
- `NEXT.md`
- The canonical plan
- Phase acceptance criteria
- Git diff/commits
- Verification evidence
- Discoveries, limitations, quirks, and new requirements

## Gate

Do not represent a phase as complete unless acceptance criteria were executed and passed.

A partial or blocked phase may still trigger reconciliation, but remains current.

## Reconcile

1. Compare the plan with the resulting system.
2. Classify discoveries: verified fact, user-locked change, technical correction, new risk, scope change, or open decision.
3. Rewrite affected current-state, architecture, phase, testing, risk, and definition-of-done sections.
4. Remove obsolete assumptions and tasks.
5. Add, split, merge, or reorder remaining work when evidence requires it.
6. Rewrite completed phase content as resulting state and ongoing invariants.
7. Keep historical rationale in Git, phase evidence, or an ADR—not in the canonical plan.
8. Update `NEXT.md` using the operator-view contract in `references/reconciliation-contract.md`.
9. Write a concise phase reconciliation report under `docs/evidence/<phase-id>/`.
10. Run the workflow validator.

## Approval Boundary

Stop and request approval before applying a reconciliation that changes:

- User-locked requirements
- Public behavior or persisted schemas
- Major dependencies/services
- Material scope, cost, security, privacy, or operations
- Distribution direction
- Source deletion or user data

You may prepare the proposed plan text, but do not begin dependent implementation.

## Idempotency

If no material fact changed, make no wording-only edits. Running this skill twice must not churn the plan.

## Done

Reconciliation is complete when:

- The canonical plan reads naturally as current truth.
- Remaining work is executable from current reality.
- `NEXT.md` identifies one exact next action and its requirements.
- Evidence and approval needs are clear.
