---
name: orient-monorepo-change
description: Use when an active AI Arsenal monorepo work item has a ready request and needs repository context before scoping, especially when source, documentation, or test evidence must be gathered without designing a change.
---

# Orient Monorepo Change

## Overview

Orientation turns a ready request into evidence-bearing context. It establishes
what is true now; scoping owns commitments, acceptance criteria, and the
change contract.

## Preconditions

1. Read root `AGENTS.md`, then every nearer applicable instruction before
   inspecting a path. Read `NEXT.md`, its referenced canonical-plan section,
   `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, the ready `request.md`, and
   `docs/workflow/templates/work-item/context.md`.
2. Confirm `NEXT.md` names exactly the request's work-item ID and pipeline step
   `orient-monorepo-change`.
3. Run:

   ```powershell
   node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
   ```

   Continue only when `valid` is `true` and `nextSkill` is
   `"orient-monorepo-change"`. Otherwise stop and report the validator blocker;
   do not repair artifacts or infer intent.

If the request is too ambiguous to determine which repository areas supply
reliable context, report the exact question and stop. Do not create a partial
context artifact.

## Gather Evidence

Read only the source, package, documentation, configuration, and tests directly
relevant to the request. Record evidence, not a proposed solution:

| Context section         | Required content                                                           |
| ----------------------- | -------------------------------------------------------------------------- |
| Applicable instructions | Root and scoped instruction paths read                                     |
| Repository snapshot     | Branch, commit, `git status --short`, and relevant existing commands/tests |
| Relevant files          | Evidence-bearing package, source, documentation, and test paths            |
| Risks                   | Known compatibility, state, workflow, or verification risks                |
| Open questions          | Unresolved facts, or `None.`                                               |

## Write and Hand Off

Create only `docs/work-items/<id>/context.md` from the context template with
this exact revision-one header:

```markdown
Work item: <id>
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready
```

Do not overwrite an existing context or create revisions; the ready-request
precondition means this stage owns only revision 1. After writing the context,
change only `NEXT.md`'s existing `Pipeline step` value to
`scope-monorepo-change`, preserving the active work-item value and all other
content. Then rerun:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
```

Success requires `valid: true` and `nextSkill: "scope-monorepo-change"`.
Report the context path, inspected evidence, open questions, and validator
result. If it fails, report the JSON blocker and do not advance further.

## Boundary

Orientation must not edit source, tests, packages, product documentation, or
the canonical plan; write an implementation plan; create acceptance criteria,
contracts, or approvals; perform release, packing, publishing, global-install,
or source-deletion actions; or change any other `NEXT.md` content. Unknown
scope belongs in **Open questions**, not an invented decision.

It must not invoke `features-cli` or inspect or mutate consumer `.scratch`
state for package self-maintenance, and it must not commit, amend, push, or
otherwise mutate Git history.

## Example

For a request affecting package validation, record the relevant `package.json`,
package manifest, validation command, and existing tests as evidence; record a
question about an unstated compatibility expectation. Do not decide the
validation rule or write its acceptance criteria.

## Common Mistakes

- Treating a request as permission to design its contract or implementation.
- Recording assumptions as facts instead of open questions.
- Skipping the post-write validator because the artifact looks complete.
- Updating `NEXT.md` before context exists, or changing more than its pipeline
  step.
