# Work Item

Work item: 2026-08-14-skip-windows-quality-worktree-regression
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-08-14T22:58:54+03:00
Max time: 2 hours
Last time check: 2026-08-14T22:58:54+03:00
Turns since time check: 2
Review cycles: 1
Review status: passed
Review snapshot: sha256:d3c7fb68928fbc5c77fab9b940cc4777e6a8a02ab606eb30096de7198910d90c
Review batch: review-20260814-windows-quality-skip-01
Review expected: ["contract"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260814-windows-quality-skip-01","snapshot":"sha256:d3c7fb68928fbc5c77fab9b940cc4777e6a8a02ab606eb30096de7198910d90c"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none
Worktree: isolated
CLI local-delivery evidence: not-required
CLI release preparation: not-required

## Goal

Make the Windows-local Workflow v2 test gate honest by skipping the Linux CI-shell-dependent Quality isolated-worktree integration test on Windows while preserving its execution on Linux and in the Ubuntu Quality workflow. This is issue #37 and is separate from the Workflow v2 compact-record repair.

## Non-goals

- Fix the underlying Windows Git/native-path test-harness compatibility issue.
- Change `.github/workflows/quality.yml` or weaken Linux/CI coverage.
- Skip any other workflow test or alter the Workflow v2 contract.
- Change product CLI behavior, package metadata, branches, worktrees, or historical records.
- Repair the separate current-v2 skill contradictions.

## Acceptance criteria

- The affected test is skipped only when `process.platform === 'win32'`.
- The skip is explicit, named, and states that the test requires the Linux CI shell/worktree environment.
- The test remains executable on non-Windows platforms, including the shell setup and native Git assertions.
- Focused workflow tests pass on Windows with exactly one additional documented platform skip, and the complete workflow gate records the resulting count honestly.
- No unrelated path or Git/worktree is modified.

## Implementation summary

- Updated `scripts/validate-monorepo-work-item.test.mjs` so the Quality isolated-worktree integration test uses Node's explicit test skip option only when `process.platform === 'win32'`.
- The skip reason is `requires the Linux CI shell/worktree environment`; the test body and Linux/Ubuntu execution path are unchanged.
- `pnpm exec prettier --write scripts/validate-monorepo-work-item.test.mjs` exited 0.
- `node --check scripts/validate-monorepo-work-item.test.mjs` exited 0.
- Focused `node --test scripts/validate-monorepo-work-item.test.mjs` exited 0 with 84 passing tests and 1 documented Windows platform skip.
- No Quality workflow, product package, CLI, branch, worktree, or historical record was changed.

## Review findings and repairs

Cycle 1 (`review-20260814-windows-quality-skip-01`, `sha256:d3c7fb68928fbc5c77fab9b940cc4777e6a8a02ab606eb30096de7198910d90c`) passed. An independent read-only reviewer confirmed the Windows-only condition, explicit skip reason, unchanged non-Windows test body, exact candidate snapshot, and task-owned changed paths. No required findings remain.

## Final verification

Result: passed

- `node --check scripts/validate-monorepo-work-item.test.mjs` — exit 0.
- `pnpm exec prettier --check scripts/validate-monorepo-work-item.test.mjs` — exit 0.
- `node --test scripts/validate-monorepo-work-item.test.mjs` — exit 0: 85 total, 84 passed, 1 Windows platform skip.
- `pnpm format:check` — exit 0.
- `pnpm lint` — exit 0: all four package lint tasks passed.
- `pnpm typecheck` — exit 0: all four package typecheck tasks passed.
- `pnpm test:workflow` — exit 0: 147 total, 144 passed, 3 skipped, 0 failed. One skip is the issue #37 Windows-only Quality test; two are pre-existing platform-dependent skips.
- `node scripts/validate-living-workflow.mjs` — exit 0.
- `node scripts/validate-monorepo-work-item.mjs --current --json` — exit 0 before delivery edits: the reviewed candidate passed with the matching independent review batch; after this verification record is written, delivery must refresh the candidate and validate the committed delivery boundary.
- `git diff --check` — exit 0.

No product CLI, package metadata, Quality workflow, issue #24 worktree, branch removal, or worktree removal was performed.
