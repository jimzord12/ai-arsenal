---
name: define-monorepo-change
description: Use when an explicit bounded AI Arsenal monorepo request has no active Workflow v2 work item.
---

# Define Monorepo Change

Read `AGENTS.md`, `NEXT.md`, the relevant canonical-plan section, the pipeline
contract, the compact template, Git status, and directly relevant repository
evidence. Run the no-active validator and continue only when it is valid.

Before writing the item, require a clean Git checkout on a non-`work/*` base
branch. Derive the deterministic branch name `work/<work-item-id>`, stop on a
branch collision, and create it with `git switch --create work/<work-item-id>`.
The branch must be created before registering the active item; do not reuse an
old work branch or develop the item on the base branch.

Create exactly `docs/work-items/<YYYY-MM-DD-slug>/work-item.md`. Record one
bounded goal, explicit non-goals, observable acceptance criteria, an ISO-8601
start time, and a realistic maximum time estimate. Classify dangerous deletion
or irreversible data loss and hard prerequisites. Routine work uses
`Approval: not-required`. Dangerous work awaiting direct approval uses
`Stage: define`, `Status: blocked`, `Approval: required`, and
`Approval source: none`; unavailable hard prerequisites likewise use blocked
define state. These are valid stops, not structural corruption.
Every newly defined compact item starts with `Review status: pending` and
`Review snapshot: pending`; absence of findings is never initial review
evidence.
For either stop, keep `NEXT.md` registered at `define-monorepo-change`; valid
validator output has no next skill and names the blocker.

The creation turn is the first counted operator turn: record zero review cycles
and `Turns since time check: 1`. When no intentional stop applies, advance to
`Stage: implement`. Set `NEXT.md` to the item and
`implement-monorepo-change`, then require the current validator to pass. Do not
create v1 request/context/contract/plan/approval artifacts. Later stages must
verify they remain on the exact `work/<work-item-id>` branch.
