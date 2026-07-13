# Task 5 Report — `scope-monorepo-change`

## Scope

- Created `.agents/skills/scope-monorepo-change/SKILL.md` and its
  implicit-invocation metadata.
- Created no real work item and changed no active-work-item state, product
  source, tests, packages, consumer `.scratch` state, or Git history.

## RED: no-skill control

The isolated no-guidance control received a time-pressured request for a new
public `--dry-run` flag with unsettled output/error and persistence behavior.
It correctly refused to choose those user decisions, but it omitted the
validator preflight and the conditional `NEXT.md` pipeline-step handoff. The
skill therefore makes both routes explicit: validate before writing, and only
advance to `plan-monorepo-change` after a complete contract without a pending
approval-boundary decision.

## GREEN: forward-use scenario

A fresh forward-use scenario read the new skill and selected this sequence:

1. Preflight the ready request/context and validator route.
2. Create only revision-1 `change-contract.md` with `request@1,context@1`.
3. Preserve the unsettled public CLI and state/schema decisions as an exact
   pending approval in `## Approval required`.
4. Leave `NEXT.md` at `scope-monorepo-change`, write no plan or product files,
   and ask the user for the missing decision.

No new rationalization appeared. This confirms that the approval stop records
the unresolved decision without treating the validator's structural routing as
authorization to plan or implement.

## Focused verification

1. Disposable temporary fixture with ready request, context, and contract:
   `node scripts/validate-monorepo-work-item.mjs --work-item
2026-07-13-scope-fixture --json`
   - Exit 0; returned `valid: true` and
     `nextSkill: "plan-monorepo-change"`.
   - The fixture was removed after the check; no real `docs/work-items` state
     was created.
2. `pnpm format:check`
   - Exit 0; Prettier reported all matched files formatted.
3. `git diff --check`
   - Exit 0; no whitespace errors.

## Decisions

- Scoping writes exactly one contract revision and advances `NEXT.md` only
  after the contract is complete and no protected decision remains pending.
- Any proposed public behavior, persisted-schema, major-dependency,
  operational, distribution, source-deletion, or user-data decision remains a
  user stop; the contract records the unanswered decision rather than choosing
  a default.

## Changed paths

- `.agents/skills/scope-monorepo-change/SKILL.md`
- `.agents/skills/scope-monorepo-change/agents/openai.yaml`
- `.superpowers/sdd/task-5-report.md`

## Concerns

The original author session stalled after producing the two scoped files, so
the controller completed the forward-use evidence and focused non-mutating
verification recorded here. No functional scope changed during recovery.
