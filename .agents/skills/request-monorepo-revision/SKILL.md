---
name: request-monorepo-revision
description: Use when a direct user request or an agent-detected in-contract defect requires revision of the active AI Arsenal monorepo work item's current contract or plan.
---

# Request Monorepo Revision

## Overview

This narrow write-capable stage records an explicit revision rationale before
changing the active route. It changes no product, consumer, release, or Git
state. It may be used autonomously for a concrete contract/plan defect discovered
during bounded work; optional improvements remain outside scope.

## Preconditions

1. Read `AGENTS.md`, `NEXT.md`, the current work item, and
   `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`.
2. Confirm either a direct user revision request or a concrete agent-detected
   defect in the active current contract/plan. Do not use this stage for optional
   expansion.
3. Run `node scripts/validate-monorepo-work-item.mjs --current --json`.
   Continue only when it is valid and the active registration identifies the
   same work item. Stop on every other result.
4. Confirm there is no current `revision-request.md` and identify the current
   target revision.

## Record the Request

Create `docs/work-items/<id>/revision-request.md` with the standard five-line
header, `Artifact: revision-request`, the next revision number, exactly one
current `contract@N` or `plan@N` prerequisite, and `Status: ready`.

Its body contains exactly one `Revision target:` field naming that target and
exactly one nonempty `Revision source:` field preserving the user's wording or
the concrete agent-detected defect. Do not broaden it into a new requirement.

Set only the existing `NEXT.md` pipeline step to `scope-monorepo-change` for a
contract target or `plan-monorepo-change` for a plan target. Then rerun the
current validator and require its matching owner route.

## Boundary

Only the current `revision-request.md` and the one existing `NEXT.md` pipeline
step may change. Do not revise the contract or plan here; their owning skills
consume the request. Do not edit product files, consumer `.scratch` state,
release state, or Git history.
