---
name: review-monorepo-change
description: Use when a Workflow v2 implementation needs consolidated review, bounded repair, and re-review before final verification.
---

# Review Monorepo Change

Validate the active compact item and inspect its goal, non-goals, acceptance
criteria, implementation summary, diff, and focused test evidence. Consolidate
findings by severity and acceptance impact. Ignore optional or out-of-scope
polish. Repair every Critical, High, Medium, and acceptance-related Minor
finding, rerun only checks invalidated by each repair, and record findings and
repairs in `work-item.md`.

At the start of each agent turn that resumes this item, increment
`Turns since time check` once. If the increment reaches five, record the
time/scope proportionality check, update `Last time check`, and reset the
counter to zero before continuing. The validator can check only this recorded
value, not unrecorded conversational turns.

Each repair/re-review increments `Review cycles`. Stop after four cycles. If a
required finding remains then, set blocked status, preserve the consolidated
blockers, and report them. When none remain, set
`Required findings remaining: no`, `Stage: verify`, and route `NEXT.md` to
`verify-monorepo-change`. Continue with the smallest reliable scope; elapsed
time is not itself failure.
