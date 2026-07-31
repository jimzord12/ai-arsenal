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
repairs in `work-item.md`. Entry into review requires review status, snapshot,
batch, expected membership, and received results all to be `pending`.

For each concrete review attempt, compute and record the candidate snapshot,
set a new non-pending batch identifier, and record a JSON array of unique,
deterministic required reviewer roles in `Review expected` plus an initially
empty JSON array in `Review received` before or with dispatch. Dispatch every
required reviewer against that exact batch and snapshot. A result record has
exactly `reviewer`, `outcome`, `batchId`, and `snapshot`; outcome is `passed`,
`failed`, `cancelled`, or `unknown`. Persist received results even when review
delegation returns synchronously; later-arriving results use the same record
shape and reconciliation path.

Use `scripts/reconcile-review-batch.mjs` to reconcile all currently available
results. Dispatch, local test success, an incomplete set, or any duplicate,
unexpected-reviewer, wrong-batch, or wrong-snapshot evidence remains pending.
A structurally complete batch with a failed, cancelled, or unknown required
result is failed. Review passes only when every expected reviewer is represented
exactly once by a matching passed result and no invalid extra evidence exists.
Record the helper's deterministically sorted expected and received arrays as
compact single-line JSON and use its status as the consolidated `Review status`.

At the start of each agent turn that resumes this item, increment
`Turns since time check` once. If the increment reaches five, record the
time/scope proportionality check, update `Last time check`, and reset the
counter to zero before continuing. The validator can check only this recorded
value, not unrecorded conversational turns.

Each completed review attempt increments `Review cycles`. Record an
unsuccessful required review for its concrete candidate as
`Review status: failed` with `Review snapshot: sha256:<64 lowercase hexadecimal
characters>`. A repair that changes candidate bytes resets review status,
snapshot, batch, expected membership, and received results to `pending` before
the fresh snapshot and batch are recorded. Stop after four cycles. If a required
finding remains then, keep the concrete failed snapshot, set blocked status,
preserve the consolidated blockers, and report them. When complete required
review evidence exists for the recorded concrete candidate, retain its concrete
batch, expected membership, and complete received set, set
`Review status: passed` with that concrete snapshot, set `Stage: verify`, and
route `NEXT.md` to `verify-monorepo-change`. This skill consumes a concrete
candidate snapshot but does not define its deterministic computation. Continue
with the smallest reliable scope; elapsed time is not itself failure.
