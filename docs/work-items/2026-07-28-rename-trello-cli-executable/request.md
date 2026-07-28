Work item: 2026-07-28-rename-trello-cli-executable
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Rename the Trello CLI executable from `work` to `jz-trello-flow` because the user strongly dislikes the current executable name.

## Desired outcome

The installed Trello Flow CLI is invoked as `jz-trello-flow` throughout package metadata, help, offline documentation, operational documentation, tests, and global installation; the obsolete `work` executable is no longer the CLI's public command.

## Constraints

- Operate autonomously and do not require repeated approval for routine details.
- Escalate only genuinely difficult or ambiguous decisions, unavailable capabilities/credentials, or hard blockers.

## User-provided context

- The requested new executable name is exactly `jz-trello-flow`.
- The package was just globally installed as `@jz/ai-arsenal-trello-work-cli@0.1.0` with executable `work`.
- The user requested changing the CLI tool name; no package-name change was requested.
