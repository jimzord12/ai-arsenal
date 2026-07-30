# `@jz/ai-arsenal-trello-work-cli`

Private TypeScript/Bun CLI for deterministic Work Units backed by Trello REST API v1. The package exposes the `jz-trello-flow` executable and no import surface.

## Responsibility boundary

The planning skill extracts and presents human-facing Work Unit drafts. This CLI owns deterministic parsing and authority enforcement, Trello references and calls, server-assigned `idShort` identity (`WU-N`), timestamps, status/list synchronization, concurrency and operation identity, read-back verification, diagnostics, stable automation output, and recovery planning.

The canonical document is one `# Work Unit` heading, one immediately following fenced `yaml` metadata block in canonical field order, and the required ordered sections. `parent` and `blocked_by` use `WU-N`; Trello card IDs are separate 24-character hexadecimal identifiers.

Inbox supports two intake paths: ordinary Trello cards listed by `jz-trello-flow inbox list`, and agent-prepared Draft Work Units created by `jz-trello-flow draft create`. `jz-trello-flow create` remains a deprecated warning-emitting alias. `jz-trello-flow design start` converts the selected card in place to In Design, preserving its Trello identity and history. In Design requires every canonical section and permits explicit `Pending:` content and `Open Questions`; transition to Ready is rejected until both are resolved. A resolved Open Questions section may say only `None`, `N/A`, or `No open questions` (optionally as one bullet and with a terminal period), and is removed by the Ready transition.

## Safety boundaries

- `status`, IDs, and timestamps are system-managed.
- Every mutating command supports `--dry-run`, `--if-version`, and `--operation-id`.
- Every exact final card description is preflighted against Trello's documented 16,384-character limit before a write. Structured failures include non-secret character/UTF-8 byte sizes and compact operation-record contribution.
- New operation records store a versioned SHA-256 digest of canonical postcondition bytes rather than the full postcondition. Exact legacy Base64URL records remain readable for replay and collision checks.
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

Use `jz-trello-flow boards list` to enumerate authenticated readable boards. Guarded list
commands are:

- `jz-trello-flow lists list --board <id-or-exact-name>`
- `jz-trello-flow lists create --board <id-or-exact-name> --name <name>`
- `jz-trello-flow lists update <list-id> --board <id-or-exact-name> --name <name> --position <top|bottom|number>`
- `jz-trello-flow lists close <list-id> --board <id-or-exact-name>`

List mutations support `--dry-run`, `--if-version`, and `--operation-id`,
verify board ownership and read-back state, preserve durable operation evidence
in Trello list action history, and return recovery data for ambiguous or partial
outcomes. Close archives a list; it never permanently deletes one and refuses
to close a list containing cards.

Status-specific list variables remain configuration inputs:

- `TRELLO_LIST_INBOX_ID`
- `TRELLO_LIST_IN_DESIGN_ID`
- `TRELLO_LIST_READY_ID`
- `TRELLO_LIST_IN_PROGRESS_ID`
- `TRELLO_LIST_REVIEW_ID`
- `TRELLO_LIST_BLOCKED_ID`
- `TRELLO_LIST_DONE_ID`

Without those overrides, statuses resolve by exact canonical names: `Inbox`,
`In Design`, `Ready`, `In Progress`, `Review`, `Blocked`, and `Done`. Run
`jz-trello-flow workflow init --board <id-or-exact-name> --operation-id <durable-id>` to
dry-run or create only missing canonical lists. Existing lists are preserved;
duplicates and wrong-board overrides fail before writes. The built-in transition
graph is Inbox → In Design; In Design → Ready; Ready → In Progress; In Progress → Review or Blocked;
Review → Done or In Progress; Blocked → Ready or In Progress; Done → none.
`TRELLO_TRANSITIONS_JSON` replaces that complete graph. Reconciliation defaults
to `description`; `TRELLO_RECONCILE_SOURCE` replaces it.

## Offline help

```text
jz-trello-flow --help
jz-trello-flow docs
jz-trello-flow docs --list
jz-trello-flow docs --topic safety
jz-trello-flow docs --search recovery
jz-trello-flow docs --output json
```

`jz-trello-flow docs` is packaged, offline, and version-matched. It covers the complete command contract, recommended human and agent workflows, configuration, credential safety, outputs, exit codes, examples, expected failures, and recovery.

## Managed Trello skills

`jz-trello-flow skills install` asks Git for the actual Git top level and installs the four version-matched `trello-work-*` skills beneath that repository's `.agents/skills/` directory. Every run replaces those four CLI-managed directories, marks their files as managed and replaceable, and preserves unrelated skills. A symbolic link or junction in `.agents`, `.agents/skills`, or a managed target is rejected before any write can escape the repository.

The command stages the complete payload and executes the official `skills-ref@0.1.0` source against all four skills before replacing a target. Set `JZ_TRELLO_FLOW_SKILLS_REF_CHECKOUT` to the actual Git top level of a clean `agentskills/agentskills` checkout pinned to `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`, and set `JZ_TRELLO_FLOW_SKILLS_REF_PYTHON` to a Python environment containing that tool's dependencies. The installer verifies the checkout top level, exact commit, and clean `skills-ref` source, then imports `skills_ref` directly from that pinned source; it never trusts an unqualified `skills-ref` on `PATH`. Missing or mismatched provenance and failed validation exit nonzero before target mutation. Use `--dry-run` to validate and report each planned `installed` or `replaced` action without changing the repository.

Replacement uses a repository-local transaction. If automatic restoration fails, the installer does not delete its sole backups: it returns `SKILLS_RECOVERY_REQUIRED` and ends the message with `Recovery data preserved at: <exact path>`. Retain that path for manual recovery. This command does not load Trello configuration or credentials and does not access Trello.

## Card attachments

Every successful `jz-trello-flow get` includes `attachmentCount` and the full
ordered attachment metadata returned by Trello. Ordinary `get` is metadata-only
and does not download or write files.

Use `--attachments-dir <directory>` on `get` to download uploaded attachments.
Downloads use authenticated binary-safe transport, preserve exact bytes, and
report absolute completed paths. External links remain metadata-only and are
never fetched. Unsafe filenames are rejected, duplicate names are
deterministically disambiguated with the attachment ID, and existing files are
never overwritten. A partial download exits nonzero and identifies the failed
attachment while reporting only files that completed.

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
