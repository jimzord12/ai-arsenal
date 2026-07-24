---
name: initializing-living-plan-workflow
description: Use when the monorepo-work-item router reports structural workflow corruption, or when canonical living-plan metadata and required workflow files need bootstrap or repair.
---

# Repair the Living-Plan Workflow

## Role

This is the bootstrap and structural-repair path, not the normal executor for
a monorepo change. Normal work starts with `orchestrate-monorepo-work` and
uses its validator-backed route. Use this skill only when the router stops for
missing, malformed, duplicated, or inconsistent workflow metadata, or when a
repository is first adopting the living-plan workflow.

## Inspect Before Repair

1. Read root and scoped `AGENTS.md` files, `NEXT.md`, the referenced canonical
   plan section, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, the router's
   stopped brief, and `git status --short`.
2. Identify the exact structural defect: required workflow file, active-item
   block, pipeline step, current artifact header, prerequisite revision,
   archive, or approval metadata.
3. Inventory affected workflow metadata before changing it. Preserve unrelated
   user instructions, work-item artifacts, evidence, and historical revisions.

## Repair Boundary

Repair only the confirmed workflow structure needed to make the existing state
readable and internally consistent. Do not guess a work-item ID, infer user
approval, change product scope, overwrite or discard an artifact, create a new
work item, edit product code, or invoke `features-cli`. If intent is required
to choose between valid repairs, stop and ask the user.

For initial bootstrap, create only missing workflow structure and preserve
existing user-provided files. Do not begin product implementation, install
dependencies, migrate source, or archive a plan before its requirements are
represented in the canonical plan.

## Validate and Return to the Router

After repair, run the applicable checks from the repository root:

```powershell
node scripts/validate-living-workflow.mjs
node scripts/validate-monorepo-work-item.mjs --work-item <repaired-id|none> --json
```

Both commands must confirm a valid state. Then invoke
`orchestrate-monorepo-work` to obtain the next stage. Do not select or execute
a write-capable normal stage from this skill, reconcile the canonical plan, or
manufacture a next action.

## Completion

Report the repaired defect, preserved artifacts, both observed validation
results, and the router-selected next skill. Stop after the repair route is
valid.
