# Task 3 report — `capture-monorepo-change`

## Result

Created the capture skill and its implicit-invocation metadata. The skill
creates exactly one revision-1 request artifact for an explicit normal-pipeline
change, registers the orient stage, and proves the resulting route with the
work-item validator.

## RED: no-skill control

Control scenario (no capture skill available):

> Add a new work item for adding an optional `--dry-run` flag to
> `features-cli`. It should preview intended changes but I have not decided
> exact output or error semantics. We need it soon. There is no active work
> item.

The fresh control proposed an unrelated zero-padded numbered ID,
`<work-item-root>/<NNN>-optional-dry-run-flag/issue.md`, and a `proposed /
needs contract` state. It also proposed changing the canonical plan and adding
an arbitrary `NEXT.md` maintenance-intake action. Those outputs violate the
pipeline's required date-kebab identity, sole `request.md` artifact, exact
revision-one header, and narrow two-field registration boundary.

The control did preserve unknown output/error semantics as unresolved details,
so the observed failure was primarily scope and output shape rather than
omission. The skill therefore uses a positive capture contract: exact identity,
artifact, header, template slots, registration values, and validator result.

## GREEN: forward-use scenario

After reading the completed skill, a fresh agent selected
`2026-07-13-features-cli-dry-run`, checked its exact directory for collision,
and correctly stopped for user direction rather than selecting an alternative
identity if it existed. It specified only:

- `docs/work-items/2026-07-13-features-cli-dry-run/request.md`;
- the exact five-line revision-one request header;
- supplied request and desired outcome;
- `None supplied.` for constraints; and
- the unknown output and error semantics as user-provided-context questions.

It limited `NEXT.md` to the active work-item and pipeline-step values, left
the canonical plan/product/later-stage artifacts unchanged, and required
validator JSON with `valid: true` and
`nextSkill: "orient-monorepo-change"`. It introduced no new rationalization,
so no wording refactor was needed.

## Disposable fixture validation

Created a temporary fixture at
`C:\Users\jimzord12\AppData\Local\Temp\ai-arsenal-task3-capture-fixture`
with only fixture `NEXT.md` registration and a conforming revision-one request
artifact. It was removed immediately after validation; no real
`docs/work-items` content was created or changed.

## Commands and results

1. `node 'C:\Users\jimzord12\Documents\GitHub\ai-arsenal\scripts\validate-monorepo-work-item.mjs' --work-item 2026-07-13-features-cli-dry-run --json` (fixture working directory)
   - Exit 0.
   - Returned `valid: true`, `nextSkill: "orient-monorepo-change"`, and one
     ready request at revision 1.
2. `pnpm exec prettier --write '.agents/skills/capture-monorepo-change/SKILL.md' '.agents/skills/capture-monorepo-change/agents/openai.yaml'`
   - Exit 0.
   - Formatted the new skill; metadata was already formatted.
3. `pnpm format:check`
   - Pending final full-repository result below.
4. `git diff --check`
   - Pending final full-worktree result below.

## Changed paths

- `.agents/skills/capture-monorepo-change/SKILL.md`
- `.agents/skills/capture-monorepo-change/agents/openai.yaml`
- `.superpowers/sdd/task-3-report.md` (required task report)

## Decisions

- Collision behavior is a hard stop for user direction; capture never allocates
  a replacement ID, overwrites, or reuses a work-item directory.
- The request template is the structural output contract. Unknown user details
  become questions in `User-provided context`, rather than invented constraints
  or acceptance criteria.
- Capture changes only the two active-registration values in `NEXT.md`; it
  does not modify its required headings, the canonical plan, or later stages.
- The no-active preflight and post-write JSON validation protect against an
  active-item conflict and require the orient stage as the next route.

## Self-review

- Confirmed the frontmatter name is valid, description is trigger-only and
  discoverable, and OpenAI metadata follows Task 2's established schema.
- Confirmed every Task 3 interface requirement appears in the skill: ID
  derivation/collision stop, complete request-template capture, two-field
  registration, and exact validator expectations.
- Applied the required RED–GREEN–REFACTOR process with a fresh no-skill
  control, a fresh forward-use scenario, and no new loophole from the forward
  run.
- No commit or push was made. No production, workflow-contract, validator,
  canonical-plan, `NEXT.md`, or real work-item file was modified.

## Concerns

The current shared `NEXT.md` has not yet received the pipeline's active-work
item fields, so the skill correctly stops rather than capturing against the
present repository state. The disposable fixture supplied the post-Task-11
metadata contract and validated the Task 3 output shape.

## Controller-completed focused checks

The author was interrupted after creating the report but before recording its
two final non-mutating checks. The controller ran them on 2026-07-13:

1. `pnpm format:check`
   - Exit 0: `All matched files use Prettier code style!`
2. `git diff --check`
   - Exit 0; no output.
