---
name: review-monorepo-change
description: Use when a Workflow v2 implementation needs consolidated review, bounded repair, and re-review before final verification.
---

# Review Monorepo Change

Validate the active compact item and confirm the checkout is the exact
`<repository-parent>/<repository-name>.worktrees/<work-item-id>` worktree on
its `work/<work-item-id>` branch created at definition. Inspect its goal, non-goals,
acceptance criteria, implementation summary, diff, and focused test evidence.
A branch mismatch is an acceptance failure, not a reason to review another
candidate. Consolidate findings by severity and acceptance impact. Ignore optional or out-of-scope
polish. Repair every Critical, High, Medium, and acceptance-related Minor
finding, rerun only checks invalidated by each repair, and record findings and
repairs in `work-item.md`. Entry into review requires all five fields to be
`pending`, in this order: `Review status`, `Review snapshot`, `Review batch`,
`Review expected`, and `Review received`.

For each concrete review attempt, compute and record the candidate snapshot
with `scripts/calculate-review-snapshot.mjs`; `NEXT.md` is excluded as
routing-only state. Set a new non-pending batch identifier, and record a JSON
array of unique, deterministic required reviewer roles in `Review expected`
plus an initially empty JSON array in `Review received` before or with
dispatch. Dispatch every
required reviewer against that exact batch and snapshot. Independent review
means another agent; it does not require a human reviewer. The reviewer must
run in a separate agent session/process from the implementing agent; repeated
passes in one agent session are self-review, not independent evidence. A
separate read-only Pi reviewer may be invoked with `pi --no-session -p` and a
read-only tool allowlist such as `--tools read,grep,find,ls`; record only its
actual result. A result record has exactly `reviewer`, `outcome`, `batchId`, and
`snapshot`; outcome is `passed`, `failed`, `cancelled`, or `unknown`. Persist
received results even when review delegation returns synchronously;
later-arriving results use the same record shape and reconciliation path.

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
candidate snapshot. Verify and deliver fail closed unless that snapshot has a
complete matching passed review batch and remains fresh. Continue with the
smallest reliable scope; elapsed time is not itself failure.
