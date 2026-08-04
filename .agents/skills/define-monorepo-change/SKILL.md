---
name: define-monorepo-change
description: Use when an explicit bounded AI Arsenal monorepo request has no active Workflow v2 work item.
---

# Define Monorepo Change

Read `AGENTS.md`, `NEXT.md`, the relevant canonical-plan section, the pipeline
contract, the compact template, Git status, and directly relevant repository
evidence. Run the no-active validator and continue only when it is valid.

Before writing the item, require a clean Git checkout on a non-`work/*` base
branch. Derive `work/<work-item-id>` and provision it only with:

```powershell
node scripts/provision-monorepo-worktree.mjs --work-item <work-item-id> --json
```

The provisioner rejects base dirt, branch or path collisions, and redirected
worktree directories before creating the deterministic isolated path
`<repository-parent>/<repository-name>.worktrees/<work-item-id>`. The active
validator later rejects a missing or redirected item worktree. Do not reuse an
old branch or worktree. After successful provisioning, enter that path:

```text
cd "<repository-parent>/<repository-name>.worktrees/<work-item-id>"
```

Create and register all item state only there; never alter the base checkout's
`NEXT.md`, which remains clean with `none` / `none`. This exact `cd` command is
the handoff/entry command for the next agent session.

Create exactly `docs/work-items/<YYYY-MM-DD-slug>/work-item.md`. Record one
bounded goal, explicit non-goals, observable acceptance criteria, an ISO-8601
start time, and a realistic maximum time estimate. Classify dangerous deletion
or irreversible data loss and hard prerequisites. Routine work uses
`Approval: not-required`. Dangerous work awaiting direct approval uses
`Stage: define`, `Status: blocked`, `Approval: required`, and
`Approval source: none`; unavailable hard prerequisites likewise use blocked
define state. These are valid stops, not structural corruption.
Every newly defined compact item declares `Worktree: isolated` and starts with
`Review status: pending` and `Review snapshot: pending`; absence of findings is
never initial review evidence.
For either stop, keep `NEXT.md` registered at `define-monorepo-change`; valid
validator output has no next skill and names the blocker.

The creation turn is the first counted operator turn: record zero review cycles
and `Turns since time check: 1`. When no intentional stop applies, advance to
`Stage: implement`. In the new worktree only, set `NEXT.md` to the item and
`implement-monorepo-change`, then require the current validator to pass. Do not
create v1 request/context/contract/plan/approval artifacts. Later stages must
verify they remain in the exact registered
`<repository-parent>/<repository-name>.worktrees/<work-item-id>` worktree on
its `work/<work-item-id>` branch.
