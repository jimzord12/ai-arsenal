---
name: plan-monorepo-change
description: Use when an active AI Arsenal monorepo work item has a ready change contract and needs an executable implementation plan before explicit user approval.
---

# Plan Monorepo Change

## Overview

Planning translates a ready, bounded change contract into one executable
revision-one implementation plan. It does not change the contract, authorize
implementation, create an approval record, or make product changes. The plan
is presented to the user and remains blocked until the user explicitly
approves its exact current contents.

## Preconditions

1. Read root `AGENTS.md`, every nearer applicable instruction, `NEXT.md`, its
   referenced canonical-plan section,
   `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, the ready
   `change-contract.md`, and
   `docs/workflow/templates/work-item/implementation-plan.md`.
2. Confirm `NEXT.md` has exactly one active-work-item block naming the same
   `<id>` as `change-contract.md`, and exactly one pipeline step,
   `plan-monorepo-change`.
3. Run the preflight validator from the repository root:

   ```powershell
   node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
   ```

   Continue only when JSON says `valid: true` and
   `nextSkill: "plan-monorepo-change"`. Otherwise stop, report the JSON
   blocker, and recommend `initializing-living-plan-workflow` for structural
   state; do not repair, infer requirements, or write a plan.

4. Confirm `change-contract.md` is the ready revision-one contract with the
   exact current acceptance-criteria and test-seam sections, and that
   `implementation-plan.md` does not already exist. This stage creates only
   revision 1; it never overwrites, archives, or creates a later revision.

## Write an Executable Plan

Create only `docs/work-items/<id>/implementation-plan.md` from the plan
template with this exact header:

```markdown
Work item: <id>
Artifact: plan
Revision: 1
Prerequisites: contract@1
Status: ready
```

Fill every plan-template section from the contract and the evidence it cites.
The plan must be an executable translation of the contract, never a new
contract. Preserve every hard wall and do not add an outcome, requirement,
dependency, acceptance criterion, test seam, or path whose need the contract
does not establish. If a contract gap prevents an executable entry, identify
the exact gap to the user and stop before writing the plan.

Use these sections and contents:

| Section                    | Required content                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `# Preconditions`          | Exact contract state, applicable instructions, required environment or data preconditions, and any approval boundary that must remain in force. |
| `## Ordered tasks`         | One ordered, independently executable entry for every implementation action needed by the contract.                                             |
| `## Affected paths`        | The exact repository-relative paths from all entries, categorized as create, modify, or delete.                                                 |
| `## Verification commands` | The exact commands from the entries and any contract-required aggregate checks, each with its expected result.                                  |
| `## Rollback`              | The ordered reversal for planned stateful changes, or `Not applicable.` when no stateful change is planned.                                     |

Every `## Ordered tasks` entry must name all of these labels, even when a
value is `Not applicable.`:

```markdown
### <number>. <short action>

- Paths: `<exact repository-relative path>`, ...
- Inputs: <named contract acceptance criteria, test seams, and relevant evidence>
- Output: <observable file, behavior, or state produced>
- Test command: `<exact command>`
- Expected result: <observable passing result or recorded failure behavior>
- Rollback: <exact reversal for a stateful change, or `Not applicable.`>
```

An entry may name more than one exact path only when the contract requires
them together. It must not use a vague path, an unspecified command, a generic
"tests pass" result, or an implicit rollback. For behavior changes, order the
focused failing test before the smallest conforming implementation and the
focused rerun. Map every acceptance criterion and test seam to at least one
entry and verification command. Include only contract-required stateful
rollback; do not invent a rollback action for a stateless documentation or
source-only change.

## Validate the Approval Block

After the complete plan is written, change only the existing `NEXT.md`
pipeline-step value to:

```markdown
**Pipeline step:** `record-monorepo-approval`
```

Preserve the active work-item value, required headings, and every other
`NEXT.md` byte. Then run:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
```

Success requires JSON `valid: true`, `nextSkill: null`, and a blocker stating
that explicit user approval of the current implementation plan is required.
If any value differs, report the JSON blocker and do not advance further.
This is a valid human-approval stop, not permission to implement.

## Present for Explicit Approval

End by presenting the complete plan to the user and asking a direct approval
question, for example: `Do you approve implementation of the current
implementation plan for <id>?` State that implementation remains blocked and
that a later `record-monorepo-approval` stage will create the digest-bound
`approval.md` only after an explicit user response.

Conversation silence, an acknowledgement, a request for a summary, or a
question is not approval. Do not create `approval.md`, compute an approval
digest, edit product files, or invoke the implementation stage in this skill.

## Boundary

The only permitted mutations are the revision-one
`docs/work-items/<id>/implementation-plan.md` for the active work item and,
after successful plan completion, the one existing `NEXT.md` pipeline-step
value. Do not edit product source, tests, package metadata, product
documentation, the canonical plan, the contract, other work-item artifacts,
or any other `NEXT.md` content. Do not invoke `features-cli`, inspect or
mutate consumer `.scratch` state, perform release, packing, publishing,
global-install, or source-deletion actions, or commit, amend, push, or
otherwise mutate Git history.

## Common Mistakes

- Turning a plan into a new contract by adding requirements, dependencies,
  acceptance criteria, test seams, or ungrounded paths.
- Writing a task without exact paths, inputs, output, test command, expected
  result, and an explicit stateful rollback note.
- Treating a validator result with `nextSkill: null` as failure or implied
  approval instead of the required explicit-approval stop.
- Creating `approval.md`, editing production files, or advancing to
  implementation before the user directly approves the exact current plan.
- Overwriting a plan, inventing a revision, changing active-work-item fields,
  or changing `NEXT.md` before the complete plan exists.
