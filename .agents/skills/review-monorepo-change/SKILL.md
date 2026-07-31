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
repairs in `work-item.md`. Entry into review requires `Review status: pending`
and `Review snapshot: pending`.

At the start of each agent turn that resumes this item, increment
`Turns since time check` once. If the increment reaches five, record the
time/scope proportionality check, update `Last time check`, and reset the
counter to zero before continuing. The validator can check only this recorded
value, not unrecorded conversational turns.

Each completed review attempt increments `Review cycles`. Record an
unsuccessful required review for its concrete candidate as
`Review status: failed` with `Review snapshot: sha256:<64 lowercase hexadecimal
characters>`. A repair that changes candidate bytes resets both review fields
to `pending` before the fresh review. Stop after four cycles. If a required
finding remains then, keep the concrete failed snapshot, set blocked status,
preserve the consolidated blockers, and report them. When complete required
review evidence exists for the recorded concrete candidate, set
`Review status: passed` with that concrete snapshot, set `Stage: verify`, and
route `NEXT.md` to `verify-monorepo-change`. This skill consumes a concrete
candidate snapshot but does not define its deterministic computation. Continue
with the smallest reliable scope; elapsed time is not itself failure.
