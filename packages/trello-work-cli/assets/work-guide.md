# Work CLI Offline Guide

This guide ships with `@jz/ai-arsenal-trello-work-cli` and is version-matched with the `jz-trello-flow` executable. `jz-trello-flow docs` is the authoritative rendered view; command syntax and option descriptions come from the same command catalog as short help.

## Concepts

A Work Unit is one Trello card whose description is a canonical `# Work Unit` Markdown document. Its fenced YAML metadata and ordered sections are validated before reads are normalized or writes begin.

- Drafts use `status: inbox`, null IDs, and null timestamps. Create an agent-prepared draft with `jz-trello-flow draft create`; `jz-trello-flow create` is a deprecated alias that emits a warning.
- Ordinary Trello cards are also valid Inbox intake. Use `jz-trello-flow inbox list`, then convert the selected card in place with `jz-trello-flow design start`.
- In Design Work Units keep every canonical section. Mark incomplete content explicitly with `Pending:` entries and optional `Open Questions`.
- In Design can enter Ready only after all `Pending:` entries and material `Open Questions` are resolved.
- Persisted cards pair `id: WU-N` with a 24-character hexadecimal `trello_card_id` and paired timestamps.
- `WU-N` comes from Trello's server-assigned board-scoped `idShort`; gaps are valid and IDs are never predicted or reused.
- `parent` and `blocked_by` contain Work Unit IDs, never Trello card IDs.
- Status, IDs, and timestamps are system-managed.
- Trello card members are plural native assignments for attention and notifications. Work Unit `owner` is the separate single stable agent or worker execution claim; neither field is synchronized automatically.

A `<reference>` is exactly one of `WU-N`, a 24-character Trello card ID, or an HTTPS Trello card URL.

## Commands

### jz-trello-flow skills install

Ask Git for the actual Git top level, then install the four bundled `trello-work-*` skills beneath that repository's `.agents/skills/` directory. Every invocation replaces exactly those four CLI-managed directories, marks their files as managed and replaceable, and preserves unrelated skill directories. A symbolic link or junction in `.agents`, `.agents/skills`, or a managed target is rejected before any write.

The command is self-contained after package installation. It stages and structurally validates the complete transformed payload before mutation and uses only files bundled with the executing CLI version. Runtime installation needs no Python, validator checkout, network, or Trello credentials. Official `skills-ref@0.1.0` validation against the exact transformed payload is a development and release gate pinned to upstream commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`; it is not an end-user runtime dependency.

Missing/mismatched provenance or failed validation exits nonzero before replacement. `--dry-run` performs discovery, preparation, and validation and reports `installed` or `replaced` for every target without changing the repository. If automatic restoration fails, sole backups remain intact and `SKILLS_RECOVERY_REQUIRED` reports `Recovery data preserved at: <exact path>`. The installer does not load Trello configuration or credentials and does not access Trello.

### jz-trello-flow get <reference>

Read and normalize one Work Unit. Use `--board <id-or-exact-name>` on every
invocation and `--output json` for automation. Every result includes
deterministically ordered `card.members` objects with stable `id`, `username`,
and `fullName`, plus `attachmentCount` and complete ordered attachment metadata.
Ordinary `get` does not download or write files.

Add `--attachments-dir <directory>` to download uploaded attachments with
authenticated binary-safe transport and report each absolute completed path.
External links remain metadata-only and are never fetched. Downloads reject
unsafe filenames, stay inside the explicit directory, deterministically
disambiguate duplicate names, and never overwrite existing files. A partial
download exits nonzero, safely identifies the failed attachment, and reports
only files already completed.

### jz-trello-flow list

List normalized Work Units on the explicitly selected board. Filters:
`--status`, `--type`, `--priority`, `--owner`, `--member`, `--parent`, and one
`--label`. `--owner` is an exact metadata-owner match. `--member` matches an
exact member ID or case-insensitive exact username and does not match display
names or substrings. All filters compose conjunctively. Duplicate options are
rejected.

### jz-trello-flow boards list

List authenticated readable boards without mutation. A board is never created,
renamed, closed, archived, or deleted by this CLI.

### jz-trello-flow lists list --board <id-or-exact-name>

List open and closed lists on the resolved board with stable ID, name, position,
and closed state.

### jz-trello-flow lists create --board <id-or-exact-name> --name <name>

Create and read back one list on the resolved board. `--position` accepts
`top`, `bottom`, or a non-negative numeric position.

### jz-trello-flow lists update <list-id> --board <id-or-exact-name>

Rename and/or reposition a list only after verifying that it belongs to the
resolved board.

### jz-trello-flow lists close <list-id> --board <id-or-exact-name>

Close/archive an empty list after board-ownership and card-occupancy preflight.
This is Trello's list-deletion semantic; the CLI never permanently deletes a
list and never closes a list containing cards.

### jz-trello-flow inbox list

List ordinary Inbox cards and canonical Draft Work Units without forcing ordinary cards to parse as Work Units. Both shapes expose deterministic native Trello members.

### jz-trello-flow draft create --file <work-unit.md> | --stdin

Validate a draft, create exactly one Inbox card, derive `WU-N` from returned `idShort`, persist IDs/timestamps, and read back before success. A dry run never predicts `WU-N`.

### jz-trello-flow design start <card-reference> --file <work-unit.md>

Claim the selected Inbox card and convert that same card in place to canonical In Design content. The Trello card ID, comments, attachments, and history are preserved.

### jz-trello-flow create --file <work-unit.md> | --stdin

Deprecated alias for `jz-trello-flow draft create`. It preserves behavior and emits a warning; new automation should use `jz-trello-flow draft create`.

### jz-trello-flow metadata update <reference> --json <merge-patch> | --file <patch.json>

Apply a validated metadata merge patch. Generic patches cannot alter status, IDs, or timestamps.

### jz-trello-flow description replace <reference> --file <description.md>

Replace the full description only after canonical validation and authority checks.

### jz-trello-flow description patch <reference> --section <section> --file <content.md>

Replace one known non-metadata section. Unknown, duplicate, empty, or malformed sections fail closed.

### jz-trello-flow transition <reference> <target-status>

Synchronize configured status metadata and Trello list. The transition graph and status/list mappings must be configured; no permissive policy is invented.

### jz-trello-flow reconcile <reference>

Detect description/metadata and status/list drift. Dry-run prints planned repairs. Execution requires an explicit source-of-truth policy.

### jz-trello-flow validate --file <work-unit.md>

Validate a local file without credentials or network access.

### jz-trello-flow validate <reference>

Read and validate a remote description without mutation.

### jz-trello-flow checklist list <reference>

List checklists and stable Trello checklist/item IDs.

### jz-trello-flow checklist create <reference> --name <name>

Create one checklist. No automatic checklist policy exists.

### jz-trello-flow checklist update <reference> <checklist-id> --name <name>

Rename a checklist addressed by stable ID.

### jz-trello-flow checklist item set <reference> <checklist-id> <item-id> --checked|--unchecked

Set one item state using stable IDs, never display-name-only addressing.

### jz-trello-flow doctor

Run read-only credential, authentication, board, required-list, and mapping diagnostics. `--hermes-env <path>` explicitly loads a Hermes env file. The same option is accepted by every command that loads local/Trello configuration; local-file validation and `jz-trello-flow docs` need no configuration.

### jz-trello-flow docs

Print this complete guide. Use `--list`, `--topic <topic>`, `--search <query>`, and `--output text|json`.

## Common mutation options

Every mutating command supports:

- `--dry-run`: validate and print the intended operation with zero mutation.
- `--if-version <version>`: perform a best-effort check-before-write version comparison and reject a stale read detected before mutation; Trello does not provide an atomic conditional write.
- `--operation-id <id>`: preserve idempotency and recovery identity.
- `--output json`: emit machine-readable data on stdout.

## Configuration and credentials

Normal API requests use `TRELLO_API_KEY` and `TRELLO_API_TOKEN`. `TRELLO_API_SECRET` is not sent. Credential values are never printed in normal output, diagnostics, errors, fixtures, or docs.

Process environment variables take precedence. A working-directory `.env` is never assumed. Use the explicit `--hermes-env <path>` path when Hermes-managed credentials should be loaded.

Every board-dependent invocation requires `--board <id-or-exact-name>`. A
24-character ID is verified directly. Board-name matching is exact: zero
matches fail without mutation and duplicate exact names require a board ID.
`TRELLO_BOARD_ID` is ignored for selection, and no board selection is persisted.

Status/list synchronization uses:

- `TRELLO_LIST_INBOX_ID`
- `TRELLO_LIST_IN_DESIGN_ID`
- `TRELLO_LIST_READY_ID`
- `TRELLO_LIST_IN_PROGRESS_ID`
- `TRELLO_LIST_REVIEW_ID`
- `TRELLO_LIST_BLOCKED_ID`
- `TRELLO_LIST_DONE_ID`

Each variable independently overrides one status. Missing values resolve exact
canonical names: `Inbox`, `In Design`, `Ready`, `In Progress`, `Review`, `Blocked`, and
`Done`. `jz-trello-flow workflow init --board <id-or-exact-name> --operation-id <id>`
creates only missing canonical lists after a complete ambiguity and override
preflight; use `--dry-run` to inspect the aggregate plan. Existing lists are
never renamed, closed, replaced, or reopened.

The built-in transition graph is Inbox → In Design; In Design → Ready; Ready → In Progress; In Progress
→ Review or Blocked; Review → Done or In Progress; Blocked → Ready or In
Progress; Done → none. `TRELLO_TRANSITIONS_JSON` replaces the complete graph.
Reconciliation defaults to `description`; `TRELLO_RECONCILE_SOURCE=description`
or `list` replaces that default.

## Explicit live E2E

The real Trello scenario runs only through the separate `test:live` script and
requires `TRELLO_LIVE_E2E=1`. Before access it also requires:

- `TRELLO_LIVE_CREDENTIAL_SOURCE=process-env`
- `TRELLO_LIVE_BOARD_SELECTOR`
- an exact 24-character `TRELLO_LIVE_BOARD_ID` allowlist

Per-list, transition-graph, and reconciliation-source overrides are optional.

Preflight authenticates, resolves the selector, confirms the exact allowlisted
board, validates all supplied overrides, and uses effective built-in-or-
overridden workflow policy. Guarded initialization creates only missing
canonical lists. Each run uses a unique marker. Cleanup performs status
transitions only, verifies disposable cards in Done, verifies run-created lists
empty, then closes those lists.
Cards, checklists, and checklist items are never archived or deleted. A card
not verified in Done or a nonempty/unclosed run list remains visible and is
reported with a credential-free recovery record.

## Recommended human workflow

1. Draft the canonical Work Unit.
2. Run `jz-trello-flow validate --file draft.md`.
3. Run `jz-trello-flow draft create --file draft.md --dry-run --operation-id <durable-id>`.
4. Confirm the explicit board selector, resolved board ID, list, and plan.
5. Execute once with the same operation ID.
6. Preserve JSON output and recovery data.

## Recommended agent workflow

1. Prefer `--output json`.
2. Read immediately before mutation and pass its version with `--if-version`.
3. Use a durable, unique operation ID.
4. Never blindly retry a partial or ambiguous result.
5. Use `jz-trello-flow get`, then `jz-trello-flow reconcile --dry-run`, then an authorized repair.

## Safety and recovery

Mutations validate current and proposed state, reject missing configuration and unsupported policy before writing, perform minimum Trello REST API v1 calls, and read back before reporting success.

A partial or ambiguous mutation returns stable recovery data. Preserve the
operation ID, board ID, resource ID, requested postcondition, and recovery
action. Do not recreate a card or list merely because a response was lost.
List operation identity remains discoverable through board-scoped Trello list
action history. `jz-trello-flow reconcile` is the Work Unit recovery boundary.

## Output and Exit codes

- Success data goes to stdout.
- Diagnostics and failures go to stderr.
- Exit `0`: success.
- Exit `1`: validation, API, or postcondition failure.
- Exit `2`: command usage error.
- Exit `3`: credential or authentication failure.
- Exit `4`: optimistic-concurrency rejection.

Every failure has a stable code. JSON errors contain an `error` object and may include non-secret recovery data.

## Examples

```text
jz-trello-flow validate --file draft.md --output json
jz-trello-flow boards list --output json
jz-trello-flow lists create --board "Testing" --name Disposable --dry-run --operation-id list-42
jz-trello-flow draft create --board "Testing" --file draft.md --dry-run --operation-id planning-42
jz-trello-flow get WU-42 --board "Testing" --output json
jz-trello-flow list --board "Testing" --status ready --priority high --output json
jz-trello-flow metadata update WU-42 --board "Testing" --json '{"priority":"high"}' --dry-run --operation-id priority-42
jz-trello-flow transition WU-42 ready --board "Testing" --if-version <version> --operation-id transition-42
jz-trello-flow reconcile WU-42 --board "Testing" --dry-run
jz-trello-flow doctor --board "Testing" --output json
jz-trello-flow docs --topic recovery
```
