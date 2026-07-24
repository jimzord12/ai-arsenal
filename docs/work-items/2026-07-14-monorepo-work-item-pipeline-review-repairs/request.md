Work item: 2026-07-14-monorepo-work-item-pipeline-review-repairs
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Resume Task 13 of the approved Monorepo Work-Item Pipeline implementation by
repairing the unresolved independent-review findings.

## Desired outcome

Complete the Task 13 repair loop so the approved pipeline implementation can
be independently reviewed, fully verified, and reconciled.

## Constraints

- Do not commit or push without separate user direction.
- Do not invoke `features-cli`, inspect or mutate consumer `.scratch` state,
  or perform release, packing, publication, global installation, or source
  deletion within this work.
- Preserve the source rollback copy, user data, LF checkout policy, and
  approved Windows/Linux target.

## User-provided context

- Tasks 11 and 12 are implemented and verified; Task 13 is incomplete.
- The active-registration validator can incorrectly accept missing or malformed
  registration as `--work-item none` and needs focused repair coverage.
- Contract and plan revisions need an executable archive, increment, and
  invalidation path that implements the normative revision contract.
- The open design question is the exact owner and artifact-removal protocol for
  contract and plan revisions while preserving the approved archive-plus-
  increment design.
