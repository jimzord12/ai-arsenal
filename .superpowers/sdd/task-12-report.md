# Task 12 Report: Disposable Work-Item Lifecycle Simulation

## Scope

Added one isolated Node test that exercises the full normal work-item lifecycle
and its failed-verification re-entry. Documented that executable coverage in the
normative pipeline guide. The fixture uses only a temporary directory and never
creates real `docs/work-items` artifacts or touches consumer `.scratch` state.

## Lifecycle Evidence

The new test creates current artifacts in order and validates the router after
each transition:

```text
request → orient
context → scope
contract → plan
plan → explicit-approval stop
approval → implement
implementation report → verify
verification passed → reconcile
reconciliation passed + active state cleared → complete
```

It overwrites only the disposable verification fixture with `Status: failed`,
observes `implement-monorepo-change`, restores `Status: passed`, and observes
`reconcile-monorepo-change` again before completing the fixture.

## Verification

- `node --test --test-name-pattern="a complete lifecycle follows every route" scripts/validate-monorepo-work-item.test.mjs` — exit `0`.
- `pnpm check` — exit `0`: formatting, lint, typecheck, 144 package tests, 12
  workflow tests, and both validators passed.

## Changed Paths

- `scripts/validate-monorepo-work-item.test.mjs`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `.superpowers/sdd/task-12-report.md`

## Concerns

None. Task 13 independent wide review and targeted repair remain before final
maintenance reconciliation.
