# Work Item

Work item: 2026-08-01-retire-source-cli
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-08-01T00:42:33+03:00
Max time: 90 minutes
Last time check: 2026-08-02T15:55:26.8960100+03:00
Turns since time check: 0
Review cycles: 4
Review status: passed
Review snapshot: sha256:fb05d42fb20181b36317367d2e4580dc9fdde25f649b07611aed21efab192614
Review batch: 2026-08-01-retire-source-cli-format-exception
Review expected: ["contract-reviewer"]
Review received: [{"reviewer":"contract-reviewer","outcome":"passed","batchId":"2026-08-01-retire-source-cli-format-exception","snapshot":"sha256:fb05d42fb20181b36317367d2e4580dc9fdde25f649b07611aed21efab192614"}]
Dangerous deletion or irreversible data loss: yes
Hard prerequisites: resolved
Approval: approved
Approval source: User on 2026-08-01: "Ok I approve"

## Goal

Retire the legacy Features CLI rollback path by safely removing the remaining
dangling `remote-logging-system\scripts\features-cli` junction after a fresh
command-specific user confirmation, then reconcile repository documentation
with the verified resulting state.

## Non-goals

- Do not follow, recreate, or remove the junction target
  `C:\Users\jimzord12\Documents\ICS\github\ics-vcr\scripts\features-cli`;
  preflight shows that target is already absent.
- Do not delete or modify consumer `.scratch` data, any other worktree path,
  `packages/features-cli`, the global pnpm installation, or packaged rollback
  artifacts.
- Do not change shipped CLI behavior, package versions, or dependencies.
- Do not close GitHub issue #14 or begin issue #13 in this work item.

## Acceptance criteria

- Re-read the exact junction and target immediately before execution; stop and
  redefine scope if the junction is no longer a dangling junction to the
  recorded absent target.
- Prove the stable globally installed `features-cli` command and a documented
  packaged rollback route remain available without relying on the legacy
  junction.
- Present the exact PowerShell removal command, exact junction path, and
  consequence to the user and obtain fresh direct confirmation immediately
  before execution.
- Remove only the junction at
  `C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system\scripts\features-cli`
  without traversing or deleting any target contents.
- Verify the junction path is absent, relevant consumer `.scratch` state is
  unchanged, and the globally installed CLI still passes help plus a read-only
  consumer smoke check.
- Reconcile the canonical plan, operating documentation, `AGENTS.md`, and
  `NEXT.md` so they no longer claim the source rollback copy remains available.
- Complete Workflow v2 review, final verification, delivery, routine Git
  commit/push, and exact-SHA CI evidence without a package version bump or
  global reinstall.

## Implementation summary

- Definition preflight confirmed the only remaining legacy source path is a
  `Directory, ReparsePoint` junction at
  `C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system\scripts\features-cli`.
- The junction points to
  `C:\Users\jimzord12\Documents\ICS\github\ics-vcr\scripts\features-cli`,
  which is already absent. The other four registered worktrees have no
  `scripts\features-cli` path.
- Repository package and global pnpm installation both report
  `@jz/ai-arsenal-features-cli@0.3.0`; `features-cli --help` exited 0.
- Read-only `features-cli status` smoke checks exited 0 in both the primary
  `ics-vcr` checkout and `remote-logging-system` worktree and returned the
  same three-feature state. Both also emitted an unrelated environment message
  that Node `v20.x.x` is not installed after producing successful status
  output.
- `docs/operations/features-cli-cutover.md` retains the packaged-artifact
  installation route, so recovery does not depend on the dangling junction.
- Destructive execution is pending the required fresh direct confirmation for
  `Remove-Item -LiteralPath
"C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system\scripts\features-cli"
-Force`.
- The user supplied fresh execution-time confirmation with `Yes I confirm`.
  Immediate read-back still matched the approved dangling-junction state, but
  the execution environment rejected the exact confirmed `Remove-Item`
  command before it ran. A second attempt using only that exact command was
  also rejected before execution. No path was removed or changed, and no
  alternative removal mechanism was attempted.
- The user then executed the approved removal externally. Current read-only
  verification confirms the junction and its former target are both absent,
  while the containing `scripts` directory and the worktree `.scratch`
  directory remain present.
- The globally installed `@jz/ai-arsenal-features-cli@0.3.0` remains present.
  `features-cli --help` and read-only `features-cli status` checks in both the
  primary `ics-vcr` checkout and `remote-logging-system` worktree exit 0 and
  report the same three-feature state.

## Review findings and repairs

- Review cycle 1 failed for snapshot
  `sha256:d6b95000d185bc9309595dea8f5c8c9e69902cf40f7f6faa74c762a3408b156e`:
  `contract-reviewer` found that the canonical plan, cutover guide, and
  `NEXT.md` still described the retired source junction as available or
  pending removal, which violated the reconciliation acceptance criterion.
- Repaired by reconciling those current-truth records, removing the legacy
  direct-source rollback command, and retaining the packaged-artifact rollback
  route. Candidate-changing repair reset the complete review batch to pending.
- Review cycle 2 failed for snapshot
  `sha256:2135572f05449f2b449dd6c18e171527545f1ec0171b5e7ca4f99c1b4a941347`:
  `contract-reviewer` found one remaining canonical-risk reference to a
  shared-junction rollback path.
- Repaired by replacing that risk treatment with the stable-command and
  packaged-artifact rollback route. Candidate-changing repair reset the
  complete review batch to pending.
- Review cycle 3 failed for snapshot
  `sha256:a67cce2b7c283969ee7bd3ebe6a43f2cb99cb9939d7fa278e811779315b88b9c`:
  `contract-reviewer` found stale canonical-plan current-state, phase-table,
  and open-decision wording that still described source retirement as pending.
- Repaired by reconciling those remaining current-truth records to the active
  review state and completed packaged-artifact-only source retirement.
  Candidate-changing repair reset the complete review batch to pending.
- Review cycle 4 passed for snapshot
  `sha256:67fd5de76d21c1e97cd6b740de63d583e5d47847761e8c2465b28e34d1a7e471`.
  `contract-reviewer` confirmed the junction and former target are absent, the
  containing `scripts` and `.scratch` directories remain present, all
  current-truth records use packaged-artifact rollback only, and no required
  finding remains.

## Final verification

Result: passed

- `pnpm check` exited 0: formatting, linting, typechecking, all package tests,
  the 108-test workflow suite, and root workflow validation passed. The suite
  reports 154 Features CLI tests, 281 passing Trello CLI tests (2 skipped),
  and 79 weekly-report CLI tests.
- `git diff --check` exited 0.
- `node scripts/validate-living-workflow.mjs` exited 0.
- `node scripts/validate-monorepo-work-item.mjs --work-item
2026-08-01-retire-source-cli --json` exited 0 and confirmed the reviewed
  verification route.
- Fresh acceptance observations confirm the legacy junction and its former
  target are absent; the containing `scripts` and `.scratch` directories
  remain present; global `@jz/ai-arsenal-features-cli@0.3.0`, `--help`, and
  both read-only consumer status checks remain available.

## Delivery evidence

- Verified implementation commit: `4110b3599ca1cdf2b340eec91977afe057883611`
  (`docs(features-cli): retire legacy rollback junction`).
- `origin/master` equals that exact commit after push.
- Exact-SHA CI passed: Quality
  <https://github.com/jimzord12/ai-arsenal/actions/runs/30748982661> and
  Windows/Linux Portability
  <https://github.com/jimzord12/ai-arsenal/actions/runs/30748982666>.
- No package behavior, package version, packed artifact, or global
  installation changed; the documented packaged-artifact rollback route and
  globally installed `@jz/ai-arsenal-features-cli@0.3.0` remain in place.
- The user explicitly authorized one formatting-only exception on 2026-08-02.
  The formatter repair will receive a fresh review batch without increasing the
  recorded four-cycle limit.
- The user-authorized formatting-only review batch passed for snapshot
  `sha256:fb05d42fb20181b36317367d2e4580dc9fdde25f649b07611aed21efab192614`.
  `contract-reviewer` confirmed only Prettier formatting changed and no stale
  source-junction claim or scope change was introduced.
