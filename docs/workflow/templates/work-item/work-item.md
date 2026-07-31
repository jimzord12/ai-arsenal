# Work Item

Work item: <YYYY-MM-DD-lowercase-kebab-slug>
Workflow: 2
Stage: implement
Status: active
Started at: <ISO-8601 timestamp>
Max time: <positive minutes or hours>
Last time check: <ISO-8601 timestamp>
Turns since time check: 1
Review cycles: 0
Review status: pending
Review snapshot: pending
Review batch: pending
Review expected: pending
Review received: pending
Dangerous deletion or irreversible data loss: <yes|no>
Hard prerequisites: <resolved|blocked>
Approval: <not-required|required|approved>
Approval source: <none|verbatim direct user approval>

<!--
Review lifecycle:
- Definition and entry into review use Review status: pending and Review snapshot: pending.
- An unsuccessful required review for a concrete candidate uses Review status: failed and Review snapshot: sha256:<64 lowercase hexadecimal characters>.
- Complete required review evidence for a concrete candidate uses Review status: passed and Review snapshot: sha256:<64 lowercase hexadecimal characters>.
- Before dispatch, a concrete review records a non-pending batch identifier, a JSON array of unique deterministic reviewer roles, and an initially empty JSON received-results array.
- Reconciliation preserves every received result and permits passed only when every expected role has exactly one matching successful result and no mismatched or unexpected evidence exists.
- Any repair that changes candidate bytes resets status, snapshot, batch, expected, and received fields to pending before re-review.
- Review snapshot is the digest returned by scripts/calculate-review-snapshot.mjs; NEXT.md is excluded as routing-only state.
- Verify and deliver fail closed unless the recorded review is passed, complete, matching, and fresh for the current candidate.
- Historical compatibility applies only to validator-recognized immutable delivered records with an exact matching hash.
- Review cycles remain bounded at four; an unsuccessful fourth cycle is blocked.
-->

## Goal

<One bounded observable outcome.>

## Non-goals

- <Explicit exclusion.>

## Acceptance criteria

- <Observable completion condition.>

## Implementation summary

Pending.

## Review findings and repairs

Pending.

## Final verification

Result: pending
