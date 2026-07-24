---
name: scope-monorepo-change
description: Use when an active AI Arsenal monorepo work item has ready request and context artifacts and needs a bounded change contract before implementation planning.
---

# Scope Monorepo Change

## Overview

Scoping converts verified request and context evidence into one complete,
bounded contract. It commits neither implementation nor approval; public,
schema, operational, distribution, deletion, and user-data decisions remain
with the user.

## Preconditions

1. Read root `AGENTS.md`, every nearer applicable instruction, `NEXT.md`, its
   referenced canonical-plan section,
   `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, the ready `request.md` and
   `context.md`, and
   `docs/workflow/templates/work-item/change-contract.md`.
2. Confirm `NEXT.md` has exactly one active-work-item block naming the same
   `<id>` as both artifacts and exactly one pipeline step,
   `scope-monorepo-change`.
3. Run the preflight validator from the repository root:

   ```powershell
   node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
   ```

   Continue only when JSON says `valid: true` and
   `nextSkill: "scope-monorepo-change"`. Otherwise stop, report its blocker,
   and recommend `initializing-living-plan-workflow` for structural state; do
   not repair, infer intent, or write a contract.

4. Confirm either the revision-one forward state or a validator-routed current
   contract revision request. Do not overwrite a current artifact.

## Contract revision recovery

When the validated route is a current contract `revision-request.md`, consume
it rather than using the revision-one flow. Archive existing downstream current
artifacts in reverse dependency order: reconciliation, verification,
implementation, approval, and plan. Archive the current contract and consumed
request under their `revisions/<filename>/v<N>.md` identities with only
`Status:` changed to `superseded`. Then write `contract@N+1` using the current
request and context prerequisites, and route to `plan-monorepo-change`.

Stop if the preflight is invalid, an archive cannot preserve its bytes except
for status, or the request target is not the current contract.

## Write the Complete Contract

Create only `docs/work-items/<id>/change-contract.md` from the contract
template with this exact header:

```markdown
Work item: <id>
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready
```

Fill every template section from the request, context, applicable instructions,
and established repository evidence:

| Section                  | Required content                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `# Goal`                 | Exactly one bounded, observable outcome.                                                                                                                |
| `## Non-goals`           | Explicit exclusions, including unrelated requests and work outside the approved scope.                                                                  |
| `## Hard walls`          | Constraints implementation must not cross. Copy every user-locked constraint verbatim; do not paraphrase, weaken, or silently add a competing decision. |
| `## Acceptance criteria` | Observable completion conditions, not implementation tasks.                                                                                             |
| `## Test seams`          | Observable behavior, state, integration, or boundary seams that can be exercised.                                                                       |
| `## Verification`        | Exact applicable verification categories and the evidence each must establish, derived from the acceptance criteria and existing repository commands.   |
| `## Approval required`   | `Yes` or `No`, with the reason. State that plan implementation still needs the later explicit approval record when applicable.                          |

Do not invent a requirement to fill a gap. If the request or evidence cannot
support a complete bounded contract, identify the exact unanswered question and
stop before the successful handoff.

## Approval Stop Before Contract Creation

Before creating or updating a current contract, stop and ask the user when
reliable contract scope depends on an unanswered decision in any of these
areas:

- public CLI or other public behavior;
- a persisted schema;
- a major production dependency;
- material operational cost, security, privacy, or support burden;
- package/distribution direction;
- source deletion; or
- user data.

Identify the exact unanswered decision and ask one direct user question. Do
not select a default, create or update `change-contract.md`, write a plan,
change product files, update `NEXT.md`, run the post-write handoff validator,
or represent this as a successful scope handoff. The active work item therefore
remains routed to `scope-monorepo-change` until the user answers directly.

After the user resolves the decision, resume normal contract creation from the
template and complete the successful-handoff validation below. Preserve any
supplied user-locked wording verbatim in the completed contract.

## Successful Handoff

Only after the contract is complete and no approval-stop decision is pending,
change only the existing `NEXT.md` pipeline-step value to:

```markdown
**Pipeline step:** `plan-monorepo-change`
```

Preserve the active work-item value, required headings, and every other
`NEXT.md` byte. Then run:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
```

Success requires JSON `valid: true` and
`nextSkill: "plan-monorepo-change"`. If either differs, report the JSON
blocker and do not advance further.

## Boundary

The only permitted mutations are the revision-1 `change-contract.md` for the
active work item and, after a successful contract, the one existing `NEXT.md`
pipeline-step value. Do not edit product source, tests, package metadata,
product documentation, the canonical plan, other work-item artifacts, or any
other `NEXT.md` content. Do not invoke `features-cli`, inspect or mutate
consumer `.scratch` state, perform release, packing, publishing, global-install,
or source-deletion actions, or commit, amend, push, or otherwise mutate Git
history.

## Common Mistakes

- Treating a ready request and context as permission to decide public behavior
  or schema details; ask and record the pending decision instead.
- Writing a vague goal, implicit non-goals, test tasks as acceptance criteria,
  or generic verification; complete each template slot with observable content.
- Omitting the preflight validator or updating `NEXT.md` before the contract is
  complete; both the starting route and the successful `plan-monorepo-change`
  route must be proven.
- Rewording user-locked constraints, creating revisions, or broadening the
  mutation boundary to resolve an uncertainty.
