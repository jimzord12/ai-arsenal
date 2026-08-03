# Work Item

Work item: 2026-08-03-remind-global-trello-shim-repair
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-08-03T14:35:15+03:00
Max time: 30 minutes
Last time check: 2026-08-03T14:44:38+03:00
Turns since time check: 0
Review cycles: 1
Review status: passed
Review snapshot: sha256:35e2b8199faf44e8751969d3d6f7ce0268a8e583bd5030ebbab62c6307f2d3b4
Review batch: review-20260803-trello-shim-reminder-02
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260803-trello-shim-reminder-02","snapshot":"sha256:35e2b8199faf44e8751969d3d6f7ce0268a8e583bd5030ebbab62c6307f2d3b4"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260803-trello-shim-reminder-02","snapshot":"sha256:35e2b8199faf44e8751969d3d6f7ce0268a8e583bd5030ebbab62c6307f2d3b4"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Record a mandatory, durable agent instruction requiring the global pnpm `jz-trello-flow` shim repair and supported smoke checks after every global installation, replacement, upgrade, downgrade, or rollback.

## Non-goals

- Do not change the Trello CLI package, generated global shim, or pnpm installation state.
- Do not access or mutate Trello state.
- Do not change unrelated agent instructions or workflow policy.

## Acceptance criteria

- Root agent instructions clearly require `pnpm --dir <repository-root> run repair:global-trello-shim` after every global package lifecycle operation that can regenerate the shim.
- Instructions require Git Bash smoke checks and CMD/PowerShell version checks before an agent reports the installation usable.
- The rule points agents to the maintained operational documentation rather than duplicating implementation details.
- Workflow validation and formatting pass.

## Implementation summary

- Added a binding root-agent rule to the existing CLI global-distribution lifecycle instructions. It requires the durable `repair:global-trello-shim` command after every global `jz-trello-flow` installation, replacement, upgrade, downgrade, or rollback.
- The rule requires the documented Git Bash version/help/docs checks and CMD/PowerShell version checks before reporting an installation usable, while delegating detailed procedure to `docs/operations/trello-work-cli-global-install.md`.

## Review findings and repairs

- Batch `review-20260803-trello-shim-reminder-01` passed contract review but quality review found stale `NEXT.md` source-of-truth entries. Replaced the prior delivered work item and unrelated features cutover document with this active work item and the authoritative Trello global-install operations document. Formatting and workflow validation pass.

## Final verification

Result: passed

- `pnpm run check` passed: formatting, lint, typecheck, package tests, workflow tests (118 passed, 2 expected skips), and workflow validation.
- Targeted Prettier checks, `git diff --check`, `node scripts/validate-living-workflow.mjs`, and the active work-item validator passed.
