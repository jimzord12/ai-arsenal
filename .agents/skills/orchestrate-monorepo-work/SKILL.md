---
name: orchestrate-monorepo-work
description: Use when resuming, routing, or reporting the next step for an AI Arsenal monorepo work item, including an unclear work-item state or a request to explain where repository work stands.
---

# Orchestrate Monorepo Work

## Overview

Route from verified repository state. This skill is read-only: it reports the
earliest eligible pipeline action and never writes files, changes Git state,
advances artifacts, grants approval, or starts a write-capable stage.

The monorepo pipeline is not a consumer workflow. Do not invoke
`features-cli`, inspect or mutate consumer `.scratch` state, or infer routing
from consumer state.

## Read Before Routing

1. Read the root `AGENTS.md`, then every nearer applicable `AGENTS.md` for
   paths inspected.
2. Read `NEXT.md`, the section of
   `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` named there, and
   `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`.
3. Inspect `git status --short` and recent relevant commits.
4. Before choosing a validator command, verify that `NEXT.md` exposes one
   readable active-work-item value and one readable pipeline-step value. Treat
   either value being missing, unreadable, duplicated, malformed, or
   inconsistent as malformed workflow metadata: stop, select
   `initializing-living-plan-workflow`, and do not infer a no-active-item state
   or run the `none` validation path. When both values are valid and name an
   active work item, run:

   ```powershell
   node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
   ```

   Run the same command with `none` only when both validated metadata values
   are explicitly `none`.

## Routing Rules

Use validator JSON as the routing authority for an active work item. Its
`nextSkill` selects the earliest eligible normal stage. A valid plan without `approval.md` routes directly to
`record-monorepo-approval`. Treat this as autonomous digest authorization, not a
human-permission stop, unless the contract includes dangerous deletion/data loss
or a hard prerequisite is unavailable.

For a valid no-active-item result, report the current `NEXT.md` action. Do not
recommend `capture-monorepo-change` until the user has described a new change
that is within the normal pipeline.

Select `request-monorepo-revision` for either a direct user revision request or
a concrete agent-detected in-contract defect in the active current contract or
plan. A failed verification may establish such a defect, but failure alone,
optional expansion, ambiguity, or a status request does not.

Release, packing, publishing, global installation, and source deletion are
outside the normal pipeline. When a user describes one of those actions, do
not route it to `capture-monorepo-change`; report it as outside this router's
scope and direct the user to the applicable release/local-distribution rules
or explicit source-deletion approval gate.

If validation is invalid, active registration is multiple or malformed,
approval is stale, or workflow metadata is malformed, stop. Set **Next skill**
to `initializing-living-plan-workflow`; do not select a normal pipeline stage.

## Required Routing Brief

Return only these eight labels, once each and in this order:

```text
Project:
Current work item:
Current pipeline step:
Next skill:
Required input:
Why this is next:
Approval/blockers:
Recommended command:
```

Populate every field from the inspected state. For a stopped report, explain
the validator or metadata defect in **Approval/blockers** and make the command
the repair-oriented inspection command. For a user-described new change with
no active item, set **Next skill** to `capture-monorepo-change` and **Required
input** to the explicit change request.

## Quick Reference

| Verified state                       | Next skill or action                   |
| ------------------------------------ | -------------------------------------- |
| No active item, no new change        | Report `NEXT.md`; do not start capture |
| No active item, new change described | `capture-monorepo-change`              |
| Direct user revision request         | `request-monorepo-revision`            |
| Release/distribution/source deletion | Stop; outside the normal pipeline      |
| Valid active state                   | Validator `nextSkill`                  |
| Valid plan awaiting authorization    | `record-monorepo-approval`             |
| Invalid or malformed state           | `initializing-living-plan-workflow`    |

## Common Mistakes

- Asking for routine plan permission instead of routing to autonomous digest
  authorization. Silence never authorizes dangerous deletion.
- Using missing or unreadable active-work-item metadata as evidence that no
  work item exists. Stop for workflow repair instead.
- Routing a release, packing, publishing, global-installation, or source-
  deletion request to `capture-monorepo-change`. Those actions are outside the
  normal pipeline.
- Advancing a stage because its artifact appears present without validator JSON.
- Returning a prose status update instead of the eight-field routing brief.
- Repairing, registering, or creating files while routing. Route first; the
  selected write-capable skill owns mutations.
