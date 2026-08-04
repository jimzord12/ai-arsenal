---
name: orchestrate-monorepo-work
description: Use when resuming, routing, or reporting the next step for an AI Arsenal monorepo work item, including an unclear work-item state or a request to explain where repository work stands.
---

# Workflow v2 (current)

For a directory containing `work-item.md`, validate the current registration
and route only by its compact `Stage` through:

```text
define → implement → review/repair → verify → deliver
```

With no active item and an explicit bounded request from a clean non-work base
checkout, route to `define-monorepo-change`; definition provisions the new
`work/<work-item-id>` at
`<repository-parent>/<repository-name>.worktrees/<work-item-id>`. With no
request, report `NEXT.md`. Pending direct
approval for dangerous work, a blocked hard prerequisite, or four exhausted
review cycles is a valid stop with no next skill. Malformed state routes to
`initializing-living-plan-workflow`. This router remains read-only.
Required CLI work remains in define/implement while release preparation is
pending; review, verify, and deliver require its package/version/manifest/
changelog declaration to be complete and valid. Delivery cannot mutate those
package bytes. Such a defect returns through implementation and a fresh review,
or blocks after the unsuccessful fourth cycle.

Return the existing eight-label routing brief. The v1 instructions below apply
only to historical directories without `work-item.md`; never start v1 work.

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
`nextSkill` selects the eligible v2 stage. New isolated items must run from the
exact registered `<repository-parent>/<repository-name>.worktrees/<work-item-id>`
worktree on their exact `work/<work-item-id>` branch; the validator fails closed
for the base checkout, another or redirected worktree, a detached checkout, or
a branch mismatch. A base checkout with `none` / `none` is valid and never
routes another worktree's active item. Valid intentional stops—pending direct
approval for dangerous work, a blocked hard prerequisite, or four exhausted
review cycles—have no next skill and must be reported without mutation.

For a valid no-active-item result, report the current `NEXT.md` action. Route a
new explicit bounded request to `define-monorepo-change`; this includes bounded
release, packing, installation, and source-deletion work when its safety and
approval boundaries can be recorded honestly.

An in-scope CLI behavior request may record routine global replacement with
`Approval: not-required` when its complete release, preflight, rollback, and
verification chain is bounded; only exact CI-green delivery may execute it.

If validation is invalid or workflow metadata is malformed, stop. Set **Next
skill** to `initializing-living-plan-workflow`; do not select a normal stage.

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
no active item, set **Next skill** to `define-monorepo-change` and **Required
input** to the explicit change request.

## Quick Reference

| Verified state                         | Next skill or action                 |
| -------------------------------------- | ------------------------------------ |
| No active item, no new change          | Report `NEXT.md`; do not define work |
| No active item, new change described   | `define-monorepo-change`             |
| Valid active state                     | Validator `nextSkill`                |
| Intentional approval/prerequisite stop | Report blocker; do not mutate        |
| Invalid or malformed state             | `initializing-living-plan-workflow`  |

## Common Mistakes

- Asking for routine permission instead of defining and delivering bounded work.
  Silence never authorizes dangerous deletion.
- Using missing or unreadable active-work-item metadata as evidence that no
  work item exists. Stop for workflow repair instead.
- Treating bounded release, packing, installation, or source-deletion work as
  automatically outside the workflow instead of recording its exact scope and
  safety boundary in `work-item.md`.
- Advancing a stage because its artifact appears present without validator JSON.
- Continuing an active item from `master` or another work branch instead of
  switching to `work/<work-item-id>`.
- Returning a prose status update instead of the eight-field routing brief.
- Repairing, registering, or creating files while routing. Route first; the
  selected write-capable skill owns mutations.
