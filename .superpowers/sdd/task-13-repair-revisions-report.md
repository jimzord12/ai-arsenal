# Task 13 Repair: Failed-Verification Revision Recovery

## Status

Completed the narrow recovery repair without commits, releases, consumer-state
access, or `features-cli` invocation.

## Root cause

The validator accepts archived incremented implementation and verification
revisions, and routes a failed verification back to implementation. However,
the implementation and verification skills required revision-one-only forward
creation, while lifecycle coverage replaced verification status in place. That
made the documented archive/increment recovery protocol inoperable.

## Changes

- `.agents/skills/implement-monorepo-change/SKILL.md`
  - Adds explicit forward and failed-verification recovery modes.
  - Requires failed verification and implementation-report archival with only
    `Status: superseded` changed, then an incremented implementation report.
  - Limits recovery to the unchanged approved contract and plan.
- `.agents/skills/verify-monorepo-change/SKILL.md`
  - Selects revision `1` for forward verification or the revision after the
    complete archived verification history during recovery.
  - Requires prerequisites to reference the current implementation revision.
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
  - Defines the archive/remove/increment sequence and the active `NEXT.md`
    handoff from recovery implementation to fresh verification.
- `scripts/validate-monorepo-work-item.test.mjs`
  - Adds isolated temporary-root coverage for failed verification recovery.
  - Proves archive headers, incremented implementation and verification
    revisions, prerequisite transitions, and active `NEXT.md` pipeline-step
    transitions through completion.

## Verification

- `node --test scripts/validate-monorepo-work-item.test.mjs` — exit `0`;
  12 tests passed, including `a failed verification recovery archives and
increments attempt records`.
- `pnpm exec prettier --check .agents/skills/implement-monorepo-change/SKILL.md .agents/skills/verify-monorepo-change/SKILL.md docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md scripts/validate-monorepo-work-item.test.mjs` — exit `0`.
- `node scripts/validate-living-workflow.mjs` — exit `0`.
- `git diff --check` — exit `0`.

## Concerns

- This repair intentionally changes only workflow documentation, skills, and
  isolated validator fixtures. It does not simulate an actual active work item
  or mutate `docs/work-items/`.
- The worktree already contained other approved pipeline changes; they were
  preserved and not included in this repair's scope.
