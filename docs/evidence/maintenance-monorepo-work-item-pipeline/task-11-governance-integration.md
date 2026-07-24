# Task 11 — Governance Integration

## Verification

- `node --test scripts/validate-living-workflow.test.mjs` — exit `0` (5 tests).
- `pnpm test:workflow` — exit `0` (11 tests).
- `pnpm validate:workflow` — exit `0` (living workflow valid; no active item).
- `pnpm format:check` — exit `0`.
- `git diff --check` — exit `0`.

## Resulting State

The router-first work-item pipeline is now named consistently by root guidance,
the operator view, canonical plan, workflow overview, validator, and legacy
compatibility skills. The consumer `.scratch/features/` workflow remains
separate.

## Remaining Work

Task 12 must add the disposable full-lifecycle simulation. Task 13 must perform
the independent wide review and any targeted repair before final maintenance
reconciliation.
