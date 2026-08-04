# Work Item

Work item: 2026-08-04-create-isolated-worktrees
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-08-04T11:28:03+03:00
Max time: 6 hours
Last time check: 2026-08-04T13:50:14+03:00
Turns since time check: 0
Review cycles: 1
Review status: passed
Review snapshot: sha256:f002b89d13e5854a2338496f6640aac1593bcb048d6e45f0ec60768ed8a303b2
Review batch: review-20260804-inline-pi-08
Review expected: ["pi-contract","pi-quality"]
Review received: [{"reviewer":"pi-contract","outcome":"passed","batchId":"review-20260804-inline-pi-08","snapshot":"sha256:f002b89d13e5854a2338496f6640aac1593bcb048d6e45f0ec60768ed8a303b2"},{"reviewer":"pi-quality","outcome":"passed","batchId":"review-20260804-inline-pi-08","snapshot":"sha256:f002b89d13e5854a2338496f6640aac1593bcb048d6e45f0ec60768ed8a303b2"}]
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
- Every active compact record declares `Worktree: isolated`; active validation
  requires both the exact branch and registered deterministic worktree, while
  only immutable delivered historical records may omit that field.
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
no required findings. The artifact commit's Quality CI then failed because the
active isolated record was checked out in Actions' base workspace. The quality
workflow now moves active checks into the deterministic linked worktree; review
fields were reset for the fourth and final permitted review cycle. Fresh
contract and quality review passed batch
`review-20260804-isolated-worktrees-04` before CI completed. Quality CI run `30894736100` then failed in the active-worktree
setup step: the nested shell quoting around the `node -e` expression leaves an
unmatched backtick. This acceptance-critical workflow defect requires repair,
but it exhausts the fourth permitted review cycle. The user then explicitly
authorized this counter reset on 2026-08-04, directed repair in this item, and
required independent reviews from a separate inline Pi agent process. The fresh
review budget starts at zero; self-review is not independent evidence.

Fresh batch `review-20260804-inline-pi-01` used two separately invoked
read-only `pi --no-session` processes against
`sha256:b907df1904753a32a90612ab0622dfbf8c2c53c7296416a4d13b1eeaf702fe0e`.
Both returned `failed`: `pi-contract` identified redirected/junction-path
validation and a missing active-item worktree-declaration boundary; `pi-quality`
confirmed the declaration boundary and identified missing executable Bash syntax
coverage for Quality CI. These required findings are repaired: active v2 records
must declare `Worktree: isolated`; lexical-versus-real-path validation rejects
redirected registered paths; and the focused test extracts the actual Quality
setup block and runs `bash -n`. The test fixtures now create real deterministic
linked worktrees (with LF retained), so branch/worktree/fresh-snapshot coverage
uses the same topology as production. The candidate changed, so the review
fields reset to pending for a new batch.

- `node --test scripts/validate-living-workflow.test.mjs scripts/validate-monorepo-work-item.test.mjs` — passed, 91 tests.
- Focused Quality setup Bash syntax, omitted-worktree declaration, branch, and deterministic-worktree tests — passed.
- `pnpm exec prettier --write <changed paths>` — passed.

An early `pi-contract` dispatch for intended batch
`review-20260804-inline-pi-02` returned `failed` against
`sha256:d258775a5180b7d576eceb915eea9df6144416e702d4f4cb847d0c92793d844e`
before `pi-quality` was dispatched, so it was incomplete and does not count as
a completed review cycle. Its required findings are repaired: only immutable
delivered historical records may omit `Worktree: isolated`, and active isolated
items unconditionally require registered-worktree Git inspection. Current
active test fixtures now use real linked worktrees. The candidate changed, so
review evidence resets pending for a complete fresh batch.

The intended batch `review-20260804-inline-pi-03` produced no recoverable
reviewer output: both requested temporary output files and the candidate diff
file were absent when resumed. The candidate snapshot remained
`sha256:326cc407c29512ca43219a375615004ea1d3adc785860971f887655d73fd9646`;
therefore no outcome is fabricated and no candidate repair is inferred. Its
incomplete evidence was reset before dispatching complete fresh batch
`review-20260804-inline-pi-04` with the same two independent reviewer roles.

Fresh batch `review-20260804-inline-pi-04` completed against
`sha256:326cc407c29512ca43219a375615004ea1d3adc785860971f887655d73fd9646`.
Separate read-only Pi processes recorded one matching `passed` result each for
`pi-contract` and `pi-quality`; reconciliation returned `passed` without
blockers. Review cycle 2 is complete and the item advances to final
verification.

Fresh batch `review-20260804-inline-pi-05` completed against
`sha256:648c365d61e97a22f0337ea2ff8f1217cfc21aa557994300052dae8da240e916`.
Both independent reviewers failed: `pi-contract` found Windows Git Bash lookup
restricted to default installation paths, while `pi-quality` found this can
still fail full checks on supported Windows layouts. Reconciliation returned
`failed` with both required outcomes. Repair must resolve a usable Git Bash
from Git itself rather than assuming a fixed installation path.

The repair derives Git Bash from `git --exec-path` on Windows, then requires
that Git installation's `bin/bash.exe`; Linux continues to use `bash` from
`PATH`. Candidate bytes changed, so the completed failed batch was retained
above and all five live review fields reset pending before a fresh batch.

Fresh batch `review-20260804-inline-pi-06` completed against
`sha256:893c59cda292ab706783ab8b8684df1b28e75c4b7eb6a4116d8cac9a63031eec`.
Separate read-only Pi processes returned one matching `passed` result each for
`pi-contract` and `pi-quality`; reconciliation passed without blockers. This
is review cycle 4, the final permitted cycle, and the item advances to final
verification.

After the fourth completed independent review cycle, required Quality CI run
`30900899541` failed on commit `65efbb76572f3150c8bbaf191343c67e546956af`.
Its active-worktree step tries to force-update
`work/2026-08-04-create-isolated-worktrees` even though Actions has already
checked out that branch, so Git rejects the update as in use. This is an
acceptance-critical CI finding. The run is recorded honestly as independent
`quality-ci` failed evidence for the current committed candidate; no repair or
fifth review cycle is authorized.

The user explicitly authorized another review-cycle reset on 2026-08-04 for
issue #29. The resumed-turn proportionality check found the bounded CI repair
still aligned with the six-hour estimate and original acceptance criteria, so
the durable turn counter reset to zero. The Quality setup now detaches the
Actions checkout before force-updating and linking the exact work branch; a
real disposable-repository test reproduces the already-checked-out branch
topology. Candidate bytes changed, so all five review fields reset pending and
the fresh authorized review budget starts at zero.

Fresh authorized batch `review-20260804-inline-pi-08` completed against
`sha256:f002b89d13e5854a2338496f6640aac1593bcb048d6e45f0ec60768ed8a303b2`.
Separate read-only Pi processes returned one matching `passed` result each for
`pi-contract` and `pi-quality`; reconciliation passed without blockers. Review
cycle 1 of the reset budget is complete, and the item advances to final
verification.

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
- The Quality-CI worktree repair passed a complete fresh `pnpm check`, including
  134 passing workflow tests and 2 platform-conditional skips, after review
  batch 04.

- Final stable run on 2026-08-04: `pnpm check` exited `1`. Formatting, lint,
  typechecking, all package suites, and 139 of 140 workflow tests passed (2
  platform-conditional skips); `Quality active-worktree setup is valid Bash`
  failed before parsing because the Windows `bash` resolution invokes WSL and
  `/bin/bash` is unavailable (`execvpe(/bin/bash) failed`). The required
  executable Bash-syntax check is therefore not portable in this checkout.
  Review evidence reset pending and the item returned to review for repair.

- Final stable run on 2026-08-04 after the Git-derived Bash repair:
  `pnpm check` exited `0` (138 workflow tests passed, 2 platform-conditional
  skips; Features CLI 154 passed; Trello Flow CLI 285 passed with 2 skipped;
  weekly-report 79 passed); `node scripts/validate-living-workflow.mjs`,
  `node scripts/validate-monorepo-work-item.mjs --current --json`, and
  `git diff --check` each exited `0`. The current validator confirmed the
  exact isolated worktree, expected branch, passed fresh review snapshot, and
  `nextSkill: "verify-monorepo-change"` before the result was recorded.

- Required CI: Quality
  [`30900899541`](https://github.com/jimzord12/ai-arsenal/actions/runs/30900899541)
  failed in the active-worktree setup because it force-updates the already
  checked-out branch; Portability
  [`30900899634`](https://github.com/jimzord12/ai-arsenal/actions/runs/30900899634)
  passed. Delivery is blocked after the fourth permitted review cycle.

- Final stable run after authorized Quality CI repair: `pnpm check` exited `0`
  with 139 workflow tests passed and 2 platform-conditional skips, 154 Features
  CLI tests passed, 285 Trello Flow CLI tests passed with 2 skipped, and 79
  weekly-report tests passed. `node scripts/validate-living-workflow.mjs`,
  `node scripts/validate-monorepo-work-item.mjs --current --json`, and
  `git diff --check` each exited `0`; the validator confirmed the fresh passed
  review snapshot and exact isolated branch/worktree.

## Delivery evidence

- Delivery result: passed; issue
  [`#29`](https://github.com/jimzord12/ai-arsenal/issues/29) is closed.
- Artifact-bearing commit:
  `e443c85cfb5ab0812b79057f217dc9f9d75c68e7`.
- Remote ref equality: local `HEAD` and
  `origin/work/2026-08-04-create-isolated-worktrees` both resolved to
  `e443c85cfb5ab0812b79057f217dc9f9d75c68e7`.
- Required CI: Quality
  [`30902781283`](https://github.com/jimzord12/ai-arsenal/actions/runs/30902781283)
  passed; Windows/Linux Portability
  [`30902781295`](https://github.com/jimzord12/ai-arsenal/actions/runs/30902781295)
  passed.
- Package, global installation, and rollback evidence: not required; this item
  changes no shipped CLI behavior.
- Branch/worktree disposition: retained. Merge, branch deletion, and worktree
  removal remain outside delivery.
