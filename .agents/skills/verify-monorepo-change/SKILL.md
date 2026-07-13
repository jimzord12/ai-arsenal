---
name: verify-monorepo-change
description: Use when an active AI Arsenal monorepo work item has an implementation report and needs independent evidence before reconciliation.
---

# Verify Monorepo Change

## Overview

Verification independently checks one active work item's contract against the
implemented worktree. It records observed evidence in `verification.md` and
routes only from that status: passed evidence goes to reconciliation; failed
evidence goes back to implementation. This stage does not reconcile planning
records, update the canonical plan, or update `NEXT.md` beyond its one pipeline
step value.

## Preconditions

1. Read root `AGENTS.md`, every nearer applicable instruction, `NEXT.md`, its
   referenced canonical-plan section,
   `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, the ready
   `change-contract.md`, current `implementation-plan.md`, ready
   `implementation-report.md`, and
   `docs/workflow/templates/work-item/verification.md`.
2. Confirm `NEXT.md` has exactly one active-work-item block naming the same
   `<id>` as the contract, plan, and implementation report, and exactly one
   pipeline step, `verify-monorepo-change`.
3. Run the preflight validator from the repository root:

   ```powershell
   node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
   ```

   Continue only when JSON says `valid: true` and
   `nextSkill: "verify-monorepo-change"`. On invalid workflow state, a
   mismatched route, missing prerequisite, or malformed active registration,
   report the JSON blocker and recommend `initializing-living-plan-workflow`.
   Do not repair state, write evidence, or infer a result.

4. Confirm the current contract, plan, and implementation report are revision
   one with `contract@1`, `plan@1`, and `implementation@1`, and that
   `verification.md` does not already exist. This forward verification creates
   revision 1 only; it never overwrites, archives, or invents a later
   verification revision.
5. Read all applicable scoped instructions before inspecting an affected path.
   Treat a contract gap, implementation deviation, missing required command,
   or inability to observe an acceptance criterion as failed verification
   evidence; do not broaden the contract or implementation to resolve it.

## Build and Run the Verification Matrix

Before writing `verification.md`, build a matrix from every contract
acceptance criterion, test seam, and stated verification requirement. For each
row, name its source, the exact command or manual observation, the expected
observable result, and the actual result. Do not accept intent, a plan, or the
implementation report as evidence; rerun or independently observe the stated
seam in the current worktree.

The matrix must include all applicable checks below, in addition to
contract-specific evidence:

- Review the current changed-file set with `git status --short`, compare it to
  `implementation-report.md` and the approved plan's affected paths, and
  inspect each changed path relevant to an acceptance criterion.
- Rerun every focused test required by the contract or approved plan, with its
  exact command and observed result.
- Run each relevant package and root check required by the contract, plan, or
  changed paths; identify the package or root command rather than recording a
  generic claim that tests passed.
- Run `git diff --check`.
- When workflow artifacts changed, run
  `node scripts/validate-living-workflow.mjs` and record its result.

Record every command's exit code and concise output. Record manual
observations precisely enough to map them to their criterion. If any required
command exits nonzero, any manual observation fails, a changed path is outside
the approved scope, or evidence is incomplete, preserve that failure rather
than retrying it away or reporting a pass.

## Write the Verification Record

Create only `docs/work-items/<id>/verification.md` from the verification
template with this exact header:

```markdown
Work item: <id>
Artifact: verification
Revision: 1
Prerequisites: contract@1,plan@1,implementation@1
Status: <passed|failed>
```

Complete every template section with observed evidence:

- `# Commands`: the verification matrix, including each criterion's command
  or manual observation.
- `## Exit codes`: the observed exit code for every command; mark manual
  observations as `Not applicable.`
- `## Observed result`: concise actual output and criterion results.
- `## Status`: `Passed.` only when every required row passed; otherwise
  `Failed.`
- `## Remaining failures`: every failed or missing required check, or `None.`
  only when the status is passed.

## Validate the Evidence Route

After the complete verification record exists, set only the existing
`NEXT.md` pipeline-step value to the route matching its recorded status:

| Verification status | Required pipeline step      |
| ------------------- | --------------------------- |
| `passed`            | `reconcile-monorepo-change` |
| `failed`            | `implement-monorepo-change` |

Preserve the active work-item value, required headings, and every other
`NEXT.md` byte. Then run:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
```

For `passed`, continue only when JSON says `valid: true` and
`nextSkill: "reconcile-monorepo-change"`; report that reconciliation is the
only next stage. For `failed`, continue only when JSON says `valid: true` and
`nextSkill: "implement-monorepo-change"`; report the recorded failures and
that repair must stay within the approved contract and plan. If either route
differs, report the JSON blocker and stop.

## Boundary

The only permitted durable mutations are the revision-one
`docs/work-items/<id>/verification.md` for the active work item and, after the
complete evidence record exists, the one existing `NEXT.md` pipeline-step
value. Isolated disposable test output is allowed. Do not edit product source,
tests, package metadata, product documentation, the canonical plan, request,
context, contract, implementation plan, approval, implementation report,
reconciliation artifact, or any other `NEXT.md` content. Passed verification
does not authorize reconciliation: do not update the canonical plan, reconcile
planning records, create `reconciliation.md`, or invoke
`reconcile-monorepo-change`. Failed verification does not authorize an
implementation change: do not repair product files or invoke
`implement-monorepo-change`. Do not invoke `features-cli`, inspect or mutate
consumer `.scratch` state, perform release, packing, publishing, global-install,
or source-deletion actions, or commit, amend, push, or otherwise mutate Git
history.

## Common Mistakes

- Treating an implementation report, a successful earlier run, or intended
  behavior as verification evidence instead of recording fresh observations.
- Omitting an acceptance criterion, test seam, changed-file check, exit code,
  required package/root command, `git diff --check`, or applicable living
  workflow validation from the matrix.
- Marking a failed, incomplete, or out-of-contract result as passed, or hiding
  a failure instead of recording it in `Remaining failures`.
- Updating the canonical plan or performing reconciliation after passed
  evidence. Only `reconcile-monorepo-change` owns that later stage.
- Trying to repair a failed result, changing anything besides the failed
  handoff, or treating failure as permission to expand the contract.
