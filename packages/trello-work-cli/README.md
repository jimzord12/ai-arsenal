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
- Boards are read-only and selected explicitly on every board-dependent invocation.
- List deletion means close/archive; nonempty lists are never closed.

## Configuration

Normal Trello requests use injected `TRELLO_API_KEY` and `TRELLO_API_TOKEN`. Process environment takes precedence. A working-directory `.env` is never assumed; `--hermes-env <path>` is the explicit path for loading Hermes-managed variables and is accepted by commands that load configuration. Local-file validation and offline docs do not load configuration.

Every board-dependent remote command requires
`--board <id-or-exact-name>`. A 24-character board ID is read directly and
verified. Board-name matching is exact: zero matches fail, and duplicate exact
matches require a board ID. `TRELLO_BOARD_ID` is not used as a fallback and no
selected-board state is persisted.

Use `work boards list` to enumerate authenticated readable boards. Guarded list
commands are:

- `work lists list --board <id-or-exact-name>`
- `work lists create --board <id-or-exact-name> --name <name>`
- `work lists update <list-id> --board <id-or-exact-name> --name <name> --position <top|bottom|number>`
- `work lists close <list-id> --board <id-or-exact-name>`

List mutations support `--dry-run`, `--if-version`, and `--operation-id`,
verify board ownership and read-back state, preserve durable operation evidence
in Trello list action history, and return recovery data for ambiguous or partial
outcomes. Close archives a list; it never permanently deletes one and refuses
to close a list containing cards.

Status-specific list variables remain configuration inputs:

- `TRELLO_LIST_INBOX_ID`
- `TRELLO_LIST_READY_ID`
- `TRELLO_LIST_IN_PROGRESS_ID`
- `TRELLO_LIST_REVIEW_ID`
- `TRELLO_LIST_BLOCKED_ID`
- `TRELLO_LIST_DONE_ID`

Without those overrides, statuses resolve by exact canonical names: `Inbox`,
`Ready`, `In Progress`, `Review`, `Blocked`, and `Done`. Run
`work workflow init --board <id-or-exact-name> --operation-id <durable-id>` to
dry-run or create only missing canonical lists. Existing lists are preserved;
duplicates and wrong-board overrides fail before writes. The built-in transition
graph is Inbox → Ready; Ready → In Progress; In Progress → Review or Blocked;
Review → Done or In Progress; Blocked → Ready or In Progress; Done → none.
`TRELLO_TRANSITIONS_JSON` replaces that complete graph. Reconciliation defaults
to `description`; `TRELLO_RECONCILE_SOURCE` replaces it.

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

The live suite is separate and explicit:

```text
TRELLO_LIVE_E2E=1 pnpm --filter @jz/ai-arsenal-trello-work-cli test:live
```

It requires process-environment credential-source confirmation and an exact
allowlisted testing-board ID plus selector. Preflight uses the effective
built-in-or-overridden list mapping, transition policy, and reconciliation
source, and guarded initialization creates only missing canonical lists. Each
run tags its resources, moves disposable cards to Done, closes only empty
run-created lists, and emits credential-free recovery records for unresolved
resources. Normal package tests skip the live scenario.

The packed boundary intentionally contains package metadata, this README, the offline guide/schema assets, and production TypeScript modules only. Tests, fixtures, coverage, configuration, environment files, and credentials are excluded.
