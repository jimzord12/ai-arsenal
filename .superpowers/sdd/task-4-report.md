# Task 4 Report — `orient-monorepo-change`

## Scope

- Created `.agents/skills/orient-monorepo-change/SKILL.md` and
  `.agents/skills/orient-monorepo-change/agents/openai.yaml`.
- Created no work item, changed no active-work-item state, and did not edit
  `NEXT.md`, the canonical plan, source, tests, packages, or product docs.

## RED: no-skill control

Scenario pressures: a same-day deadline, an "obvious" change, a senior request
to add acceptance criteria and an implementation plan, and an instruction to
avoid validation unless necessary.

The isolated no-guidance control chose to inspect the request and repository,
write only context, and refuse source edits, acceptance criteria, and a plan.
It failed the required handoff behavior by explicitly saying: "Do not run a
validator; this is not a completed implementation phase or reconciliation."

Decision: the skill makes preflight and post-write validator checks explicit,
ordered requirements. The post-write result must be `valid: true` with
`nextSkill: "scope-monorepo-change"`.

## GREEN: forward-use scenario

With the new skill, a fresh isolated agent in a hypothetical ready-request
fixture chose to:

- read applicable instructions before evidence paths;
- inspect only request-relevant source/package/docs/config/tests and record
  branch, commit, status, commands, risks, and questions;
- create only revision-1 `context.md`, then change only `NEXT.md`'s pipeline
  step to `scope-monorepo-change`;
- run both validator checks and require the specified handoff result; and
- refuse acceptance criteria, implementation planning, contracts, approvals,
  product changes, and release actions despite the deadline and senior request.

It also stopped without creating a partial artifact when the request could not
identify relevant repository areas. No new rationalization appeared, so no
refactor beyond the minimal validator counter was needed.

## Verification

- `node --test --test-name-pattern "ready request and context route to scoping" scripts/validate-monorepo-work-item.test.mjs`
  - Exit 0; one passing test. The test creates an OS-temporary fixture and
    verified `nextSkill: "scope-monorepo-change"`; it did not change real
    work-item state.
- `pnpm format:check`
  - Exit 0; Prettier reported all matched files formatted.
- `git diff --check`
  - Exit 0; no whitespace errors.

## Decisions

- Orientation is evidence collection, not scoping: unknowns are recorded in
  `Open questions`, never converted into acceptance criteria or a solution.
- The skill rejects ambiguous requests only when they prevent identifying
  reliable context; otherwise it records unresolved facts as questions.
- Pipeline handoff updates only the existing `Pipeline step` after the context
  exists, then validates the resulting state.

## Concerns

- The mandated dedicated `project-rules-auditor` cannot be selected through
  this runtime's native subagent interface, so the separate project-rules audit
  is `INCOMPLETE`. Root instruction review was performed directly before
  authoring, and no nearer instructions apply to the two new skill paths.
- This report is the explicitly requested Task 4 evidence artifact; the only
  functional files created are the two requested skill files.

## Independent-review repair

Added the explicit boundary that orientation must not invoke `features-cli` or
inspect or mutate consumer `.scratch` state for package self-maintenance, and
must not commit, amend, push, or otherwise mutate Git history. `pnpm
format:check` and `git diff --check` both exited 0 after this focused repair.
