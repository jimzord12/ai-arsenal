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
Worktree: isolated
CLI local-delivery evidence: <required|not-required>
CLI release preparation: <pending|not-required|{"status":"complete","package":"<package-name>","version":"<semver>","manifest":"<relative-package.json-path>","changelog":"<relative-sibling-CHANGELOG.md-path>"}>

<!--
Worktree policy: definition runs only from a clean, non-`work/*` base checkout
and creates the exact `work/<work-item-id>` branch at
`<repository-parent>/<repository-name>.worktrees/<work-item-id>`. It writes this
record and the active `NEXT.md` route only in that worktree; the base stays clean
with `none` / `none`. `Worktree: isolated` requires every active stage to run
from that exact registered path and branch. Delivery does not merge, delete, or
remove branches or worktrees; worktree removal remains dangerous deletion.

For a CLI behavior item, record the complete release chain, preflight, rollback,
and verification in its bounded scope. The CI-green global replacement then uses
Approval: not-required; dangerous deletion and separately authorized external
mutations do not. A required item appends `## Delivery evidence` with exactly
one line for each of: Delivery result, Artifact-bearing commit, Remote ref
equality, Required CI, Package, Tarball, Global replacement, Installed-shim
smoke, Installed artifact provenance, Rollback, and Clean worktree. Delivery
cannot close until every category is successful and mutually consistent.
Required CLI work uses `CLI release preparation: pending` through definition and
implementation, then records the complete package/version/manifest/changelog
object after Changesets has generated the final package bytes and before review.
Non-CLI work uses `CLI release preparation: not-required`. Delivery must not
create or apply Changesets or edit package source, manifest, or changelog bytes;
package-byte defects return to implementation and a fresh bounded review.


Review lifecycle:
- Definition and entry into review use Review status: pending and Review snapshot: pending.
- An unsuccessful required review for a concrete candidate uses Review status: failed and Review snapshot: sha256:<64 lowercase hexadecimal characters>.
- Complete required review evidence for a concrete candidate uses Review status: passed and Review snapshot: sha256:<64 lowercase hexadecimal characters>.
- Before dispatch, a concrete review records a non-pending batch identifier, a JSON array of unique deterministic reviewer roles, and an initially empty JSON received-results array.
- Independent review means another agent; it does not require a human reviewer. The reviewer runs in a separate agent session/process; repeated passes in one agent session are self-review, not independent evidence.
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
