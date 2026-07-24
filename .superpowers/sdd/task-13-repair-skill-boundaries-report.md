# Task 13 Report: Legacy Skill Boundaries

## Scope

Repaired only the three named skills. No product files, work items, consumer
`.scratch` state, `features-cli`, release/distribution state, or Git history
were changed.

## RED

A focused guidance check failed before the repair because:

- `reconciling-living-plan` did not require validator-backed `none` metadata
  before classifying the repository as no-active-item.
- `orchestrate-monorepo-work` did not explicitly forbid `features-cli` and
  consumer `.scratch` operations.
- `capture-monorepo-change` did not explicitly forbid those operations.

## GREEN

- Legacy reconciliation now treats absent, duplicate, unreadable, malformed,
  or inconsistent active metadata as structural corruption and stops at
  `initializing-living-plan-workflow`. Its narrow repair path starts only when
  both fields are explicitly `none` and `--work-item none` validation returns
  `valid: true`.
- Router and capture guidance now explicitly prohibit `features-cli` invocation
  and consumer `.scratch` inspection or mutation.

## Verification

- Focused Task 13 guidance assertion — exit `0`; all four required routing and
  self-hosting rules matched the repaired skills.
- Scoped Prettier write — exit `0`; all four changed Markdown files were
  already formatted.
- `pnpm validate:workflow` — exit `0`; living-workflow validation passed and
  `--work-item none` returned `valid: true` with `nextSkill: null`.
- `git diff --check` — exit `0`.

## Changed Paths

- `.agents/skills/reconciling-living-plan/SKILL.md`
- `.agents/skills/orchestrate-monorepo-work/SKILL.md`
- `.agents/skills/capture-monorepo-change/SKILL.md`
- `.superpowers/sdd/task-13-repair-skill-boundaries-report.md`
