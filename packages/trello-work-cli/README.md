# `@jz/ai-arsenal-trello-work-cli`

Private TypeScript/Bun CLI for deterministic Work Units backed by Trello REST API v1. The package exposes the `work` executable and no import surface.

## Responsibility boundary

The planning skill extracts and presents human-facing Work Unit drafts. This CLI owns deterministic parsing and authority enforcement, Trello references and calls, server-assigned `idShort` identity (`WU-N`), timestamps, status/list synchronization, concurrency and operation identity, read-back verification, diagnostics, stable automation output, and recovery planning.

The canonical document is one `# Work Unit` heading, one immediately following fenced `yaml` metadata block in canonical field order, and the required ordered sections. `parent` and `blocked_by` use `WU-N`; Trello card IDs are separate 24-character hexadecimal identifiers.

## Safety boundaries

- `status`, IDs, and timestamps are system-managed.
- Every mutating command supports `--dry-run`, `--if-version`, and `--operation-id`.
- Missing board/list configuration, transition policy, or reconciliation policy fails before mutation.
- Ambiguous mutation outcomes return recovery data and are never blindly retried.
- Mutations read back and verify postconditions before reporting success.
- No automatic checklist policy, transition graph, board/list ID, or source-of-truth policy is invented.
- Credential values are redacted and `TRELLO_API_SECRET` is not sent with key/token requests.

## Configuration

Normal Trello requests use injected `TRELLO_API_KEY` and `TRELLO_API_TOKEN`. Process environment takes precedence. A working-directory `.env` is never assumed; `--hermes-env <path>` is the explicit path for loading Hermes-managed variables and is accepted by commands that load configuration. Local-file validation and offline docs do not load configuration.

Remote board behavior uses `TRELLO_BOARD_ID` and status-specific list variables:

- `TRELLO_LIST_INBOX_ID`
- `TRELLO_LIST_READY_ID`
- `TRELLO_LIST_IN_PROGRESS_ID`
- `TRELLO_LIST_REVIEW_ID`
- `TRELLO_LIST_BLOCKED_ID`
- `TRELLO_LIST_DONE_ID`

Configured transition behavior uses `TRELLO_TRANSITIONS_JSON`. Reconciliation requires `TRELLO_RECONCILE_SOURCE=description` or `list`.

## Offline help

```text
work --help
work docs
work docs --list
work docs --topic safety
work docs --search recovery
work docs --output json
```

`work docs` is packaged, offline, and version-matched. It covers the complete command contract, recommended human and agent workflows, configuration, credential safety, outputs, exit codes, examples, expected failures, and recovery.

## Development

From the monorepo root:

```text
pnpm --filter @jz/ai-arsenal-trello-work-cli format
pnpm --filter @jz/ai-arsenal-trello-work-cli lint
pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck
pnpm --filter @jz/ai-arsenal-trello-work-cli test
pnpm --filter @jz/ai-arsenal-trello-work-cli validate
```

Tests use temporary files, injected Trello transports/clients, and real local Bun processes. They do not load live credentials or mutate Trello.

The packed boundary intentionally contains package metadata, this README, the offline guide/schema assets, and production TypeScript modules only. Tests, fixtures, coverage, configuration, environment files, and credentials are excluded.
