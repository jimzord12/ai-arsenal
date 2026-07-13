---
name: implement-monorepo-change
description: Implement one approved, digest-bound AI Arsenal monorepo work-item contract and hand it to verification.
---

# Implement Monorepo Change

## Overview

Implementation carries out one active work item's ready contract and
digest-bound approved plan in the current worktree. It produces the allowed
source, test, and documentation changes and one durable implementation report.
It ends at the verification handoff; it does not verify, reconcile, release,
or perform consumer or Git-history operations.

## Preconditions

1. Read root `AGENTS.md`, every nearer applicable instruction, `NEXT.md`, its
   referenced canonical-plan section,
   `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, the ready
   `change-contract.md`, the current `implementation-plan.md`, `approval.md`,
   and `docs/workflow/templates/work-item/implementation-report.md`.
2. Confirm `NEXT.md` has exactly one active-work-item block naming the same
   `<id>` as the contract, plan, and approval, and exactly one pipeline step,
   `implement-monorepo-change`.
3. Run the preflight validator from the repository root:

   ```powershell
   node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
   ```

   Continue only when JSON says `valid: true` and
   `nextSkill: "implement-monorepo-change"`. The validator also proves that
   the approved plan digest matches the exact current plan bytes. On a missing
   approval, stale digest, invalid workflow state, or any different route,
   report the JSON blocker and recommend
   `initializing-living-plan-workflow` for structural state. Do not repair,
   edit, or begin implementation.

4. Confirm the current contract, plan, and approval are revision one with
   `contract@1`, `plan@1`, and `approval@1` as the implementation-report
   prerequisites. Confirm that `implementation-report.md` does not already
   exist. This forward implementation creates revision 1 only; it does not
   overwrite, archive, or invent a later report revision.
5. Compare every intended change against the contract's goal, hard walls,
   acceptance criteria, test seams, and affected paths in the approved plan.
   Stop before an out-of-contract change, ambiguity, missing prerequisite, or
   needed deviation. A deviation requires a return to the appropriate earlier
   planning stage; it is never an undocumented implementation expansion.
6. Before reading or changing every affected path, read all applicable scoped
   instructions. In particular, when a plan affects `packages/features-cli/`,
   read `packages/features-cli/AGENTS.md` and do not invoke `features-cli` to
   manage, plan, or track work on that package.

## Implement Test-First

For every behavior change, use this order for the exact focused test seam in
the approved plan:

1. Write the focused failing test.
2. Run that test and observe the intended failure.
3. Make the smallest conforming implementation change.
4. Rerun the focused test and observe it pass.

Do not write an implementation first and retrofit its test. Keep each change
within the approved contract and plan; do not add a dependency, public
behavior, schema change, distribution action, or unrelated refactor to make a
test convenient. Documentation-only changes still require their applicable
formatter and workflow validation.

Run the contract- and plan-required checks after the focused work. Inspect
their real exit statuses and output. If a required check fails, keep the
failure evidence, stop the successful handoff, and report the exact blocker;
do not claim verification or continue into a later stage.

## Write the Implementation Report

Only after the approved work is complete and its required implementation
checks have been run, create
`docs/work-items/<id>/implementation-report.md` from the implementation-report
template with this exact header:

```markdown
Work item: <id>
Artifact: implementation
Revision: 1
Prerequisites: contract@1,plan@1,approval@1
Status: ready
```

Complete every template section:

- `# Changed paths`: every path changed during implementation.
- `## Decisions`: implementation decisions kept within the contract.
- `## Tests`: every test added or changed and each focused and required check
  already run, including its result.
- `## Deviations`: `None.` only when none occurred; a deviation is a stop
  condition, not permission to proceed.

The report records implementation evidence; it is not a verification artifact
and must not claim verification has passed.

## Validate the Verification Handoff

After the complete report exists, change only the existing `NEXT.md`
pipeline-step value to:

```markdown
**Pipeline step:** `verify-monorepo-change`
```

Preserve the active work-item value, required headings, and every other
`NEXT.md` byte. Then run:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
```

Success requires JSON `valid: true` and
`nextSkill: "verify-monorepo-change"`. If either differs, report the JSON
blocker and stop. Do not create `verification.md`, run the verification stage,
reconcile planning records, or advance another pipeline step.

## Boundary

Permitted mutations are the contract- and approved-plan-scoped source, test,
and product-documentation changes; the revision-one
`docs/work-items/<id>/implementation-report.md`; and, after a complete report,
the one existing `NEXT.md` pipeline-step value. Do not edit the canonical plan,
the request, context, contract, implementation plan, approval, verification,
or reconciliation artifacts, or any other `NEXT.md` content. Do not invoke
`features-cli`, inspect or mutate consumer `.scratch` state, perform release,
packing, publishing, global-install, or source-deletion actions, or commit,
amend, push, or otherwise mutate Git history.

## Common Mistakes

- Treating a valid plan without a current matching approval digest as
  authorization to implement.
- Implementing an unplanned or out-of-contract discovery instead of stopping
  for the appropriate earlier pipeline stage.
- Skipping the observed failing focused test before a behavior change, or
  describing an unrun check as passing.
- Writing a partial report, omitting changed paths or test evidence, or
  recording a deviation as though it were approved scope.
- Reconciling the canonical plan, creating `verification.md`, releasing,
  changing consumer state, or mutating Git history after implementation.
