Work item: 2026-07-27-trello-work-cli-live-e2e
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Start a new monorepo work item for real end-to-end validation of `@jz/ai-arsenal-trello-work-cli` against a dedicated Trello testing board. Carry it through the repository pipeline only as authorized, without revising the completed offline work item in place.

## Desired outcome

A maintainable live-E2E harness covering supported happy paths plus essential realistic failure and recovery boundaries, with deterministic setup, isolation, assertions, and cleanup of disposable test resources.

## Constraints

- Use only the explicitly confirmed testing board and test lists; never touch production boards or unrelated cards.
- Keep API key and token values environment-only. Never print, persist, fixture, report, or commit credentials.
- Confirm board and list identifiers and the credential source before live access.
- Preserve evidence for ambiguous mutations and make cleanup recovery-aware; do not hide leaked disposable resources.
- Do not release, publish, or globally install the package as part of this work.
- Do not edit tests or product code before this work item is captured, scoped, planned, and approved under the repository workflow.
- Carry the work item through the repository pipeline only as authorized.

## User-provided context

- The previous offline implementation is merged on `master` at `ee51e795bcacb54463815bb5ceb14bbac1505d3d` and must not be revised in place.
- A dedicated Trello testing board exists or will be identified for this work.
- Unanswered question: What exact Trello testing board ID is authorized?
- Unanswered question: What exact test list IDs are authorized for Inbox, Ready, In Progress, Review, Blocked, and Done?
- Unanswered question: What environment-only credential source is authorized for live access?
- Unanswered question: What transition policy and reconciliation source should the live harness use?
