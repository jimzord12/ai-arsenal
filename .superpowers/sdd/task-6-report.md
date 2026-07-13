# Task 6 Report — `plan-monorepo-change`

## Scope

- Created `.agents/skills/plan-monorepo-change/SKILL.md` and its
  implicit-invocation metadata.
- Created no real work item and changed no active-work-item state, product
  source, tests, packages, consumer `.scratch` state, or Git history.

## RED: no-skill control

The no-guidance control could describe a revision-one plan and the later user
approval request, but it omitted the validator preflight. It also identified
that it could not honestly invent exact paths or commands absent from the
contract or its evidence. The skill therefore requires the preflight route,
exact labeled task entries, and a stop for a contract gap before any plan is
written.

## GREEN: forward-use scenario

With the completed skill, a forward-use control first required a valid
`plan-monorepo-change` validator route, then selected only a revision-one plan
with `contract@1`. It retained every contract hard wall, used the exact
paths/inputs/output/test/expected-result/rollback task shape, and mapped every
criterion and seam to an entry and verification command. It changed only the
pipeline step to `record-monorepo-approval`, required the valid blocked
approval JSON result, and asked the user to approve the exact plan. It did not
create `approval.md` or permit implementation.

## Focused verification

1. `node --test --test-name-pattern 'a ready plan without approval blocks for
explicit user approval' scripts/validate-monorepo-work-item.test.mjs`
   - Exit 0; one passing test proved the required valid, blocked plan state.
2. `pnpm format:check`
   - Exit 0; Prettier reported all matched files formatted.
3. `git diff --check`
   - Exit 0; no whitespace errors.

## Decisions

- Planning translates only the ready contract; it cannot resolve a contract
  gap, add an ungrounded path, or create an approval record.
- A `nextSkill: null` validator response with the explicit-approval blocker is
  the required human stop, never a failure or inferred permission to implement.

## Changed paths

- `.agents/skills/plan-monorepo-change/SKILL.md`
- `.agents/skills/plan-monorepo-change/agents/openai.yaml`
- `.superpowers/sdd/task-6-report.md`

## Concerns

The original author session stalled after creating the two scoped files. The
controller recovered only the missing formatting and non-mutating scenario and
focused-test evidence recorded here; no functional Task 6 scope changed.
