Work item: 2026-07-26-trello-work-unit-cli
Artifact: reconciliation
Revision: 1
Prerequisites: verification@2
Status: passed

# Resulting state

`@jz/ai-arsenal-trello-work-cli` now exists as a verified TypeScript package implementing the approved offline Work Unit V1 boundary. Deterministic parsing, schema enforcement, dry-run planning, references, mutation/version guards, durable operation replay, partial-recovery signaling, secret redaction, strict CLI parsing, and offline documentation are implemented. Exact replay is checked before stale-version rejection while every new write remains version-guarded; metadata/description replay re-verifies the complete requested postcondition. Package and repository checks pass, including 15 Trello CLI suites/159 tests, 9 features CLI suites/154 tests, and 30 workflow tests. No live Trello resources, credentials, consumer state, distribution, Git history, or installation were mutated.

## Canonical-plan updates

Update current verified state, repository architecture/layout, test evidence, current risks, open decisions, and the immediate operator action to include the verified Trello Work Unit CLI. Preserve the explicit deferral of board/list identifiers, credential/configuration source, live integration, and a production-safe atomic ID allocator. Normalize snapshot provenance to the reviewer's reproducible recipe: a sorted newline-delimited SHA-256 manifest over the declared candidate inventory. The reviewer's before/after 56-file digest was `0d091dd80d4516fee46147e11ffc7153e6de9b3d4e8441ebde5f5ec480f82c72`; the earlier implementer digest used a non-reproducible serialization recipe and is not authoritative.

## NEXT.md update

Clear the active registration to `none` / `none`. The exact next action is to decide whether to authorize a separate commit/push operation for this verified worktree. Release, publication, local/global distribution, real Trello configuration/integration, credential access, and source deletion remain outside this reconciliation and require separate direction where applicable.

## Risks

- Live Trello behavior remains unverified until the user supplies board/list configuration and separately authorizes a safe integration exercise.
- A production atomic Work Unit ID allocator remains deferred; the offline allocator contract must not be represented as a proven Trello-backed concurrency mechanism.
- Trello credentials remain environment-only sensitive inputs and must never be logged, persisted in work-unit files, or sent as `TRELLO_API_SECRET`.
- The former manifest digest discrepancy is resolved as documentation/provenance only by naming one reproducible sorted-manifest recipe; it did not indicate candidate drift.

## Next action

Decide whether to authorize a separate commit and push of the verified `feat/trello-work-unit-cli` worktree; do not release, distribute, configure live Trello, access credentials, or mutate Trello as part of that decision unless separately authorized.
