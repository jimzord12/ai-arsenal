# Handoff — Monorepo Work-Item Pipeline implementation

Date: 2026-07-13 · Feature/Task: `docs/superpowers/plans/2026-07-13-monorepo-work-item-pipeline.md` · Session focus: Resume the approved work-item pipeline from Wave 1.

## Objective

Implement the approved artifact-driven, read-only-routed maintenance pipeline through verification, independent review, targeted repair, and final living-plan reconciliation, while preserving the consumer `.scratch/features/` workflow and `features-cli` self-hosting boundary.

## Status / Resume Point

Preflight orientation and `pnpm check` baseline are complete; the baseline passed with 144 package tests. The current maintenance phase in `NEXT.md` and the canonical plan has been updated to the approved pipeline implementation, which temporarily takes priority over the deferred CI-confirmation action.

Task 1 is complete and review-approved. It created the shared guide, eight templates, a read-only Node validator, public child-process tests, and root workflow scripts. The initial task review found route/`Pipeline step`, completed-state, and archive-header integrity defects; all were repaired test-first and re-reviewed clean. Latest focused evidence is 11/11 workflow-validator tests passing, `pnpm validate:workflow` passing, and `pnpm format:check` passing.

Task 2 (`orchestrate-monorepo-work`) was paused before it wrote files or a report. Resume Task 2 from `.superpowers/sdd/task-2-brief.md`, review it after its focused checks, then continue Tasks 3 and 4 before Wave 2. The durable SDD ledger is `.superpowers/sdd/progress.md`.

## Artifacts Touched

- `NEXT.md` — preflight next action now targets pipeline implementation; Task 11 later adds active-work-item fields.
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` — preflight maintenance state, phase map, and immediate next action.
- `docs/evidence/maintenance-monorepo-work-item-pipeline/preflight-reconciliation.md` — preflight reconciliation record.
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md` — normative artifact, revision, approval, routing, and mutation contract.
- `docs/workflow/templates/work-item/*.md` — all eight durable artifact templates.
- `scripts/validate-monorepo-work-item.mjs` — Node-built-in, read-only validator.
- `scripts/validate-monorepo-work-item.test.mjs` — 11 public-CLI integrity and routing tests.
- `package.json` — `test:workflow`, `validate:workflow`, and updated root `check` script.
- `.superpowers/sdd/` — progress ledger, per-task briefs, Task 1 report, and review packages; preserve these session artifacts while resuming.
- `packages/features-cli/AGENTS.md`, `docs/evidence/maintenance-features-cli-self-hosting-boundary/`, `docs/superpowers/specs/`, and `docs/superpowers/plans/` — approved prior-session work that must remain untouched.

## Pitfalls & Discoveries

- This is the ordinary `master` checkout with approved uncommitted source inputs. A new worktree would omit those inputs; work in place and never reset, stash, discard, or overwrite them.
- Never use `features-cli` or consumer `.scratch` state for this work. `packages/features-cli/AGENTS.md` prohibits it for package self-maintenance.
- The validator requires `NEXT.md` pipeline step to equal the computed route. A completed work item validates only after `NEXT.md` is `none` / `none`; a completed item left active is structural corruption.
- Historical revisions are `revisions/<artifact-filename>/v<N>.md`; each must have a complete header, `Status: superseded`, correct prerequisite names/order, and existing referenced revisions.
- The `py` launcher and the SDD Bash `task-brief` script are unavailable. Use `python` for handoff allocation and the existing PowerShell-generated briefs in `.superpowers/sdd/`.

## Do-Not-Do / Constraints

- Follow the approved design and implementation plan unless a verified technical correction is necessary.
- Keep the router strictly read-only; exclude release, packing, publishing, global installation, and source-deletion automation.
- Use `superpowers:subagent-driven-development`; every skill-writing task gets a fresh author subagent and a task review. Do not commit or push.
- Keep agents sequential for shared state; no parallel edits to shared files.
- Finish with the three plan-required independent review lenses, focused repairs, then `pnpm check`, `pnpm validate:workflow`, `git diff --check`, and `git status --short` before reconciliation.

## Next Session Focus

Resume Task 2 by reading `.superpowers/sdd/task-2-brief.md`, creating only `.agents/skills/orchestrate-monorepo-work/SKILL.md` and `agents/openai.yaml`, testing the skill with a no-skill control and forward test, running its focused checks, and dispatching a read-only task reviewer. Update the ledger only after clean review.

## Suggested Skills

- `superpowers:using-superpowers` — select the current task’s required skills before action.
- `executing-living-plan-phase` — re-orient from `NEXT.md`, canonical plan, Git state, and approval evidence.
- `superpowers:subagent-driven-development` — continue the task/review/ledger sequence.
- `superpowers:writing-skills` — required test-first authoring for Tasks 2–10.
- `superpowers:receiving-code-review` and `superpowers:systematic-debugging` — apply if task or wide reviews identify a defect.
- `reconciling-living-plan` — use after full verification for final current-truth reconciliation.
