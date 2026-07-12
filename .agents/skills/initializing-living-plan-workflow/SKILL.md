---
name: initializing-living-plan-workflow
description: Use when a repository is adopting or repairing the canonical living-plan workflow and AGENTS.md, NEXT.md, plan files, skills, or input-document organization are missing, stale, or inconsistent.
---

# Initializing the Living-Plan Workflow

## Goal

Create or repair a coherent workflow state without beginning product implementation.

## Required Outputs

- Root `AGENTS.md`
- Root `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `.agents/skills/`
- Organized input/evidence/decision/archive locations

## Rules

- Inventory before moving.
- Preserve user instructions and inputs.
- Never overwrite an existing `AGENTS.md` wholesale.
- Maintain or add the `living-plan-workflow` managed section.
- Do not scaffold product code, install dependencies, or migrate source code.
- Do not archive a plan until its requirements are represented in the canonical plan.

## Procedure

1. Resolve the intended repository root and inspect Git status.
2. Read all active instruction files and inventory every existing file.
3. Confirm required workflow files and repository skills exist.
4. Merge missing workflow guidance into `AGENTS.md`; preserve unrelated rules.
5. Create missing files from this skill’s `assets/`, adapting them to known project facts.
6. Place unabsorbed references under `docs/input/`; preserve provenance.
7. Validate all references and run `node scripts/validate-living-workflow.mjs` when available.
8. Record initialization evidence.
9. Invoke **REQUIRED SUB-SKILL:** `reconciling-living-plan`.
10. Update `NEXT.md` to the first real discovery/implementation phase.
11. Report what changed, remaining blockers, and the exact next action.

## Git Root

If no Git repository exists, confirm the folder is the intended project root before running `git init`.

## Completion

Initialization is complete only when the workflow is internally consistent, all inputs are preserved, and `NEXT.md` points to the correct next phase.

Stop after initialization. Do not begin the next phase.
