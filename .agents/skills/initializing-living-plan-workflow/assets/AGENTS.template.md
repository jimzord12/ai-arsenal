# Project Agent Operating Guide

<!-- living-plan-workflow:start -->

## Resume Contract

On every session, read `NEXT.md`, its referenced canonical-plan sections, Git
status, and relevant recent commits. Use `orchestrate-monorepo-work` as the
read-only entry point.

## Mandatory Workflow

Current work uses one compact `work-item.md` and this route:

```text
define → implement → review/repair → verify → deliver
```

New items are provisioned from a clean non-`work/*` base checkout into the
exact `work/<work-item-id>` branch at
`<repository-parent>/<repository-name>.worktrees/<work-item-id>`. The new
worktree alone owns its active `NEXT.md` route; the base checkout remains
`none` / `none`. Active stages must stay in that registered worktree and branch.
Delivery never merges, deletes, prunes, or removes it; worktree removal is
dangerous deletion requiring direct confirmation.

Required normal skills:

- `orchestrate-monorepo-work`
- `define-monorepo-change`
- `implement-monorepo-change`
- `review-monorepo-change`
- `verify-monorepo-change`
- `deliver-monorepo-change`

At the start of each agent turn that creates or resumes the active item,
increment `Turns since time check` once. If the increment reaches five, record
the time/scope proportionality check, update `Last time check`, and reset the
counter to zero. The validator checks only the durable recorded value; it
cannot observe omitted conversational turns.

Awaiting direct approval for dangerous deletion or irreversible data loss, an
unavailable hard prerequisite, and exhausted review cycles are valid stopped
states. Malformed workflow structure alone routes to
`initializing-living-plan-workflow`. `executing-living-plan-phase` and
`reconciling-living-plan` are legacy compatibility paths, not normal stages.

Final verification must record an explicit passed result before delivery.
Delivery reconciles current truth and reruns only checks invalidated by its own
edits before clearing active registration and completing authorized Git work.

The canonical plan is current truth. `NEXT.md` is its short derived operator
view.

<!-- living-plan-workflow:end -->
