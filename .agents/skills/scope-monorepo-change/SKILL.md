---
name: scope-monorepo-change
description: Use when an active AI Arsenal monorepo work item has ready request and context artifacts and needs a bounded change contract before implementation planning.
---

# Scope Monorepo Change

## Overview

Scoping converts verified request and context evidence into one complete,
bounded contract. The agent owns routine bounded product, schema, operational,
distribution, and user-data decisions grounded in current authority. Direct
approval is reserved for dangerous deletion or irreversible data loss; hard
missing prerequisites are escalation blockers.

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

| Section                       | Required content                                                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `# Goal`                      | Exactly one bounded, observable outcome.                                                                                                                                                                                        |
| `## Non-goals`                | Explicit exclusions, including unrelated requests and work outside the approved scope.                                                                                                                                          |
| `## Hard walls`               | Constraints implementation must not cross. Copy every user-locked constraint verbatim; do not paraphrase, weaken, or silently add a competing decision.                                                                         |
| `## Acceptance criteria`      | Observable completion conditions, not implementation tasks.                                                                                                                                                                     |
| `## Test seams`               | Observable behavior, state, integration, or boundary seams that can be exercised.                                                                                                                                               |
| `## Verification`             | Exact applicable verification categories and the evidence each must establish, derived from the acceptance criteria and existing repository commands.                                                                           |
| `## Approval required`        | `Yes` only for dangerous deletion or similarly irreversible data loss; otherwise `No` with autonomous authority. Record hard missing prerequisites separately as blockers.                                                      |
| `## Authority classification` | Include exactly `Dangerous deletion or irreversible data loss: yes/no` and `Hard prerequisites: resolved/blocked`, with each value wrapped in backticks in the artifact. Autonomous authorization requires `no` and `resolved`. |

Do not invent a requirement to fill a gap. If the request or evidence cannot
support a complete bounded contract, identify the exact unanswered question and
stop before the successful handoff.

## Autonomous Scope Resolution and Escalation

Resolve routine product, schema, dependency, distribution, cost, security,
privacy, and operational decisions from the direct request, repository
authority, current architecture, and smallest safe bounded interpretation. Do
not ask for permission merely because a decision is consequential.

Stop for direct approval only when the contract necessarily includes dangerous
deletion or similarly irreversible data loss. Escalate when a hard prerequisite
is unavailable or no honest interpretation can satisfy contradictory authority,
including missing credentials/access required for mandatory E2E tests. Do not
mock, skip, or downgrade the required evidence to keep moving.

## Successful Handoff

Only after the contract is complete and no hard escalation blocker is pending,
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

- Guessing past a genuinely unavailable hard prerequisite or dangerous deletion
  boundary; escalate those narrow conditions without turning routine design
  judgment into a permission prompt.
- Writing a vague goal, implicit non-goals, test tasks as acceptance criteria,
  or generic verification; complete each template slot with observable content.
- Omitting the preflight validator or updating `NEXT.md` before the contract is
  complete; both the starting route and the successful `plan-monorepo-change`
  route must be proven.
- Rewording user-locked constraints, creating revisions, or broadening the
  mutation boundary to resolve an uncertainty.
