# Work Item

Work item: 2026-08-04-create-isolated-worktrees
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-08-04T11:28:03+03:00
Max time: 6 hours
Last time check: 2026-08-04T11:28:03+03:00
Turns since time check: 1
Review cycles: 3
Review status: passed
Review snapshot: sha256:c825f2be7369685c8839140ae690c4760bcb39927b7eed10be79dab9d5264a4e
Review batch: review-20260804-isolated-worktrees-03
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260804-isolated-worktrees-03","snapshot":"sha256:c825f2be7369685c8839140ae690c4760bcb39927b7eed10be79dab9d5264a4e"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260804-isolated-worktrees-03","snapshot":"sha256:c825f2be7369685c8839140ae690c4760bcb39927b7eed10be79dab9d5264a4e"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none
Worktree: isolated
CLI local-delivery evidence: not-required

## Goal

Extend Workflow v2 so defining a new item provisions its deterministic `work/<work-item-id>` branch in an isolated sibling worktree, allowing independent active items to proceed without sharing a mutable checkout.

## Non-goals

- Change CLI behavior, release a package, install globally, publish, mutate live Trello, or remove a worktree or branch.
- Redesign the review-evidence model, CLI-delivery evidence, PR merge policy, or the five-stage Workflow v2 order.
- Automatically merge, remove, prune, or delete branches or worktrees.

## Acceptance criteria

- The template, normative pipeline, root guidance, router, definition/delivery skills, validator, and tests describe one consistent worktree-per-item contract while preserving `work/<work-item-id>` branch names and historical delivered compatibility.
- Definition requires a clean non-work base checkout, detects branch/path/worktree collisions or redirection, creates `<repository-parent>/<repository-name>.worktrees/<work-item-id>`, and leaves the base checkout clean with no active route.
- Active routing and validation fail closed from the base checkout, another worktree, a detached checkout, a missing or redirected item worktree, or a branch other than the exact item branch; resume guidance names the deterministic worktree entry command.
- Focused disposable-repository tests prove exact matching, two independent concurrent items without cross-routing or snapshot interference, clean-base preflight, collision rejection, and historical compatibility.
- The documentation defines safe parallel delivery/reconciliation when branches later merge and states that worktree removal is outside routine delivery and requires the dangerous-deletion confirmation boundary.
- Workflow validation and the full repository checks pass on the final snapshot.

## Implementation summary

Implemented the isolated Workflow v2 worktree contract.

### Changed paths

- `scripts/provision-monorepo-worktree.mjs`
- `scripts/validate-monorepo-work-item.mjs`
- `scripts/{validate-monorepo-work-item,validate-living-workflow}.test.mjs`
- `scripts/validate-living-workflow.mjs`
- `AGENTS.md`, workflow guides, compact template, and current normal-stage skills

### Decisions

- New definitions provision `work/<work-item-id>` with a tested Git helper at
  `<repository-parent>/<repository-name>.worktrees/<work-item-id>`; the base
  checkout remains clean with `NEXT.md` at `none` / `none`.
- New compact records declare `Worktree: isolated`; active validation requires
  both the exact branch and registered deterministic worktree while historical
  records without that field remain readable.
- Delivery leaves merge, branch deletion, and worktree removal outside routine
  workflow work; removal remains dangerous deletion with direct confirmation.

### Focused checks

- Failing-first: the missing provisioner, redirected-worktree validator, and
  absent authority-policy tests each failed before their implementation.
- `node --test scripts/validate-living-workflow.test.mjs scripts/validate-monorepo-work-item.test.mjs` — passed, 89 tests.
- `pnpm exec prettier --check <affected paths>` — passed.
- `node scripts/validate-living-workflow.mjs` — passed.
- `node scripts/validate-monorepo-work-item.mjs --current --json` — passed.
- `git diff --check` — passed.

## Review findings and repairs

Review batch `review-20260804-isolated-worktrees-01` passed with no Critical,
High, Medium, or acceptance-related Minor findings. Delivery reconciliation
then updated the canonical plan and `NEXT.md`, changing candidate bytes; all
review fields were reset for the required fresh review. Fresh contract and
quality review passed batch `review-20260804-isolated-worktrees-02` at
`sha256:788edc7c35684c75955afd876de070616e0b6f8b8c29c1b17ab68faf96490343` with
no required findings. The commit hook then found two root-ESLint
`preserve-caught-error` findings in the new missing-worktree paths; both errors
now retain their caught cause, and the candidate requires fresh review. Fresh
contract and quality review passed batch
`review-20260804-isolated-worktrees-03` at
`sha256:c825f2be7369685c8839140ae690c4760bcb39927b7eed10be79dab9d5264a4e` with
no required findings.

## Final verification

Result: passed

- `pnpm check` — passed. This ran repository formatting; package lint and
  typechecking; 154 Features CLI, 285 Trello Flow CLI (2 skipped live cases), and
  79 weekly-report tests; 134 passed workflow tests with 2 platform-conditional
  skips; and both workflow validators.
- `node scripts/validate-monorepo-work-item.mjs --current --json` — passed on
  the exact `work/2026-08-04-create-isolated-worktrees` branch and registered
  isolated worktree.
- `node scripts/validate-living-workflow.mjs` — passed.
- `git diff --check` — passed.
- Delivery reconciliation changed only planning/routing records; the invalidated
  checks (`pnpm exec prettier --check` for those records,
  `node scripts/validate-living-workflow.mjs`, current-item validation, and
  `git diff --check`) passed again after fresh review.
- The pre-commit lint repair reran `pnpm lint:root`, the focused 89-test
  workflow-validator suite, formatting, living-workflow validation, and
  `git diff --check`; all passed after review batch 03.
