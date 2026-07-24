Work item: 2026-07-14-monorepo-work-item-pipeline-review-repairs
Artifact: implementation
Revision: 1
Prerequisites: contract@2,plan@2,approval@2
Status: ready

# Changed paths

- `.agents/skills/request-monorepo-revision/SKILL.md`
- `.agents/skills/request-monorepo-revision/agents/openai.yaml`
- `.agents/skills/orchestrate-monorepo-work/SKILL.md`
- `.agents/skills/scope-monorepo-change/SKILL.md`
- `.agents/skills/plan-monorepo-change/SKILL.md`
- `AGENTS.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/workflow/WORKFLOW_OVERVIEW.md`
- `scripts/validate-living-workflow.mjs`
- `scripts/validate-living-workflow.test.mjs`
- `scripts/validate-monorepo-work-item.mjs`
- `scripts/validate-monorepo-work-item.test.mjs`

## Decisions

- A revision request is a separate control artifact rather than a normal
  pipeline-order artifact, so it can coexist with current downstream evidence
  until the owning scope or plan stage archives that evidence.
- The validator routes a valid current contract request only to scoping and a
  valid current plan request only to planning.
- Revision-request history is contiguous and preserves each consumed request
  as a superseded archive with its original target and source.
- The living-workflow validator enforces the direct-user entry boundary,
  revision-recovery instructions, skill identity, and the root `--current`
  validation command.

## Tests

- RED: the new work-item revision-request routing and validation tests failed
  before validator support existed.
- RED: the expanded living-workflow fixture suite produced the expected four
  structural failures before the new skill and enforcement rules existed.
- `node --test scripts/validate-monorepo-work-item.test.mjs` — passed 19/19.
- `node --test scripts/validate-living-workflow.test.mjs` — passed 11/11.
- `pnpm test:workflow` — passed 30/30.
- `pnpm validate:workflow` — passed; the active work item remained valid and
  routed to implementation before this report.
- `pnpm check` — passed formatting, linting, typechecking, all 144 package
  tests, both workflow suites, and both workflow validators.
- `git diff --check` — passed with no whitespace errors.

## Deviations

None.
