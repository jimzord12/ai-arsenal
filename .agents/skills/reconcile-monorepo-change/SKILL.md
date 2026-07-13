---
name: reconcile-monorepo-change
description: Use when an active AI Arsenal monorepo work item has passed verification and needs current-truth planning reconciliation and deterministic closure.
---

# Reconcile Monorepo Change

## Overview

Reconciliation is the final normal work-item stage. It consumes passed
verification and every current work-item artifact, records passed
reconciliation evidence, updates the canonical planning records as current
truth, and closes the active registration. It never treats failed verification
as reconcilable completion, and it does not create a follow-on work item.

## Preconditions

1. Read root `AGENTS.md`, every nearer applicable instruction, `NEXT.md`, its
   referenced canonical-plan section,
   `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, every current work-item
   artifact (`request.md`, `context.md`, `change-contract.md`,
   `implementation-plan.md`, `approval.md`, `implementation-report.md`, and
   `verification.md`),
   `docs/workflow/templates/work-item/reconciliation.md`, and
   `references/reconciliation-contract.md`.
2. Confirm `NEXT.md` has exactly one active-work-item block naming the same
   `<id>` as every current artifact and exactly one pipeline step,
   `reconcile-monorepo-change`.
3. Run the preflight validator from the repository root:

   ```powershell
   node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
   ```

   Continue only when JSON says `valid: true` and
   `nextSkill: "reconcile-monorepo-change"`. Confirm the current
   `verification.md` has `Status: passed` and names the validator-confirmed
   current contract, plan, and implementation revisions as prerequisites. A
   failed verification, an invalid route, a mismatched active registration,
   missing prerequisite, malformed artifact, or an existing
   `reconciliation.md` is a stop condition: do not repair, write evidence,
   reconcile planning records, or close the item. Report the JSON blocker and
   recommend `initializing-living-plan-workflow` for structural state.

4. Confirm the request, context, contract, plan, approval, implementation
   report, and verification record are the validator-confirmed current
   revisions, and that the reconciliation record does not already exist. This
   forward reconciliation creates the new reconciliation artifact at revision
   one only; it never overwrites, archives, or invents a later reconciliation
   revision.
5. Before changing every planning record, read all applicable scoped
   instructions. Base resulting state, risks, decisions, and next action on
   passed verification and current artifacts, not on intent, the plan, or the
   implementation report alone. Stop for a user-locked change, public
   behavior or schema change, major dependency or service, material scope,
   cost, security, privacy, operations, distribution-direction change, source
   deletion, or user-data action requiring approval.

## Record Passed Reconciliation Evidence First

Before changing the canonical plan, `NEXT.md`, or active fields, create only
`docs/work-items/<id>/reconciliation.md` from the reconciliation template with
this exact header:

```markdown
Work item: <id>
Artifact: reconciliation
Revision: 1
Prerequisites: verification@<current revision>
Status: passed
```

Complete every template section from observed passed verification:

- `# Resulting state` states the verified current system state.
- `## Canonical-plan updates` identifies affected current-truth sections.
- `## NEXT.md update` records the exact active-item closure and the next action
  derived from the canonical plan.
- `## Risks` records remaining or newly material risks.
- `## Next action` names one exact operator action; it must be derived from
  the canonical plan and must not manufacture a new work item.

Write no passed reconciliation record if verification is failed, incomplete,
out of contract, or not independently evidenced. Failed verification is never
reconcilable as complete.

## Reconcile Current-Truth Planning Records

After the complete passed reconciliation record exists:

1. Compare current planning records to the verified result and classify each
   discovery as verified fact, user-locked change, technical correction, new
   risk, scope change, or open decision.
2. Update every affected canonical-plan section: current verified state,
   user-locked requirements, architecture, phase map, completed/current/future
   phase details, testing and verification, risks, open decisions, and
   definition of done. Keep the canonical plan as current truth rather than a
   changelog; preserve historical rationale in evidence, an ADR, or Git
   history.
3. Remove obsolete assumptions and tasks, and add, split, merge, or reorder
   remaining work only when passed evidence requires it. Do not churn wording
   when no material fact changed; a second reconciliation must be idempotent.
4. Update the operator view in `NEXT.md` under the contract. Preserve one
   exact next action derived from the canonical plan, its concrete
   requirements, blockers or approval boundary, and the 30-second shape. Do
   not manufacture a new work item.

## Close and Validate the Item

Only after passed reconciliation evidence exists and planning records are
reconciled, change the existing `NEXT.md` active fields to exactly:

```markdown
**Active work item:** `none`
**Pipeline step:** `none`
```

Preserve the canonical-plan-derived next action and all other required
operator-view content. Then run:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
node scripts/validate-living-workflow.mjs
```

Completion requires the first JSON result to say `valid: true`,
`nextSkill: null`, and a completion blocker/status, with reconciliation status
`passed`; the living-workflow validator must exit zero. If either check fails,
preserve the observed result, do not represent the item as complete, and report
the blocker. Do not manufacture a new active item to make validation pass.

## Boundary

The permitted durable mutations are the new revision-one
`docs/work-items/<id>/reconciliation.md`, the canonical planning records, and
the existing `NEXT.md` planning/operator fields needed to reconcile current
truth and clear the active registration after passed evidence. Do not edit
product source, tests, package metadata, consumer documentation, request,
context, contract, implementation plan, approval, implementation report, or
verification record. Do not invoke `features-cli`, inspect or mutate consumer
`.scratch` state, perform release, packing, publishing, global-install, or
source-deletion actions, or commit, amend, push, or otherwise mutate Git
history.

## Common Mistakes

- Treating a failed, incomplete, or merely intended verification result as
  passed reconciliation input.
- Updating the canonical plan, `NEXT.md`, or active fields before a complete
  passed reconciliation record exists.
- Clearing only one active field, leaving a manufactured next work item, or
  closing the item before the validator confirms completion.
- Turning the canonical plan into a chronological change diary instead of
  reconciling current truth, decisions, risks, and remaining work.
- Omitting the completed validator route or the living-workflow validation.
- Releasing, changing consumer state, invoking `features-cli`, or mutating Git
  history as part of reconciliation.
