Work item: 2026-07-26-trello-work-unit-cli
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Create a new TypeScript package for the custom Trello Work Unit workflow CLI under the `ai-arsenal` pnpm/Turborepo monorepo and implement everything that does not require the Trello board/list configuration, which the user will provide later.

## Desired outcome

A new monorepo package implements the deterministic Work Unit boundary as far as possible offline, based on the reconciled Work Unit contract, with the ID allocation mechanism designed by the agent and live Trello configuration/integration deferred until the user supplies it.

## Constraints

- Package location: `C:\Users\jimzord12\Documents\GitHub\ai-arsenal\packages\<new-package>`.
- Language: TypeScript.
- Repository remains a pnpm Turborepo monorepo.
- The agent owns the Work Unit ID mechanism design.
- Implement only behavior that does not require the still-unknown Trello board and Inbox list configuration.
- Do not create Trello cards or remote resources without explicit authorization.

## User-provided context

- The planning skill owns extraction, clarification, classification recommendations, and human-facing draft presentation.
- The CLI owns deterministic schema and authority enforcement, IDs, timestamps, status/list synchronization, concurrency, Trello calls, read-back verification, and stable machine-readable errors.
- The intended first vertical slice is validated Work Unit file → dry-run plan → one verified Inbox card.
- The installed and staged planning-skill packages differ; the staged V1.1 contract was recommended as the canonical baseline.
- The Trello board and Inbox list configuration will be supplied tomorrow.
- Open question deferred by the user: exact Trello board/list identifiers and credentials/configuration source.
