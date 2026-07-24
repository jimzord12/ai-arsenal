Work item: 2026-07-14-monorepo-work-item-pipeline-review-repairs
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md` at the repository root applies to the work-item, workflow, and
  script paths inspected. No nearer `AGENTS.md` applies to those paths.
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md` defines the normative
  work-item artifact, active-registration, revision, invalidation, and
  mutation-boundary contracts.

## Repository snapshot

- Branch: `master`.
- Commit: `1b75263513f2e97bab9dc86fe1e7e911b187c440`.
- `git status --short` shows the existing uncommitted Monorepo Work-Item
  Pipeline implementation, its Task 11–13 evidence, unrelated feature-resume
  planning artifacts, and this captured work item.
- `node scripts/validate-monorepo-work-item.mjs --work-item
2026-07-14-monorepo-work-item-pipeline-review-repairs --json` reports a
  valid ready request and `orient-monorepo-change` as the next skill.

## Relevant files

- `docs/superpowers/plans/2026-07-13-monorepo-work-item-pipeline.md` Task 13
  requires three independent review lenses, targeted repair of concrete
  findings, complete verification, and a user-facing handoff.
- `scripts/validate-monorepo-work-item.mjs` returns `null` from
  `parseActiveState` when `NEXT.md` contains neither active-registration
  field; its `--work-item none` branch then accepts that missing registration.
- `scripts/validate-monorepo-work-item.test.mjs` covers conflicting duplicate
  registrations but the reviewed evidence identifies missing-registration
  coverage as absent.
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md` requires archive-plus-
  incremented revisions and downstream invalidation when request, context,
  contract, or plan revisions change.
- `.agents/skills/scope-monorepo-change/SKILL.md` and
  `.agents/skills/plan-monorepo-change/SKILL.md` currently create only
  revision-one artifacts and state that they never archive or create later
  revisions.
- `.superpowers/sdd/task-13-repair-revisions-report.md` records the completed
  failed-verification recovery repair; it does not add contract or plan
  revision ownership.
- `.superpowers/sdd/progress.md` records Tasks 1–12 as complete and Task 13
  as the remaining review-and-repair stage.

## Risks

- Active-registration validation must reject missing, malformed, duplicate,
  and inconsistent states without treating an absent block as inactive.
- Contract or plan revision behavior must preserve superseded history,
  prerequisite integrity, downstream invalidation, and the fresh-approval
  requirement.
- The worktree is intentionally dirty; unrelated and pre-existing changes
  must remain intact.
- This work must remain separate from consumer `.scratch` state and must not
  invoke `features-cli`.

## Open questions

The request records one open design question: which stage owns the exact
archive and downstream-artifact removal protocol for contract and plan
revisions while preserving the approved archive-plus-increment design.
