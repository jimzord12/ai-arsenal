Work item: 2026-07-27-trello-work-cli-live-e2e
Artifact: contract
Revision: 3
Prerequisites: request@1,context@1
Status: ready

# Goal

Deliver a stateless, opinionated-but-overridable live-E2E boundary for `@jz/ai-arsenal-trello-work-cli` that resolves an explicitly supplied existing Trello board by ID or exact name on every board-dependent invocation, provides canonical workflow defaults plus guarded list CRUD and initialization on that selected board, exercises supported Work Unit and list happy paths plus essential realistic failure/recovery behavior only on the confirmed testing board, and leaves disposable cards in Done through status transitions.

## Non-goals

- Creating, modifying, closing, archiving, or deleting Trello boards.
- Persisting a selected board or introducing project-level or user-global CLI state.
- Permanently deleting Trello lists; Trello list deletion is represented by closing/archiving the list.
- Archiving or deleting Trello cards, checklists, or checklist items.
- Touching production boards, unrelated boards, pre-existing cards, or user data outside the explicitly selected operation target.
- Changing the Work Unit document schema or inventing new workflow statuses.
- Release, packing, publication, global installation, or source deletion.
- Exhaustive failure matrices or production infrastructure beyond supported happy paths and essential realistic failure/recovery boundaries.

## Hard walls

- Use only the explicitly confirmed testing board and test lists; never touch production boards or unrelated cards during live E2E.
- Keep API key/token values environment-only. Never print, persist, fixture, report, or commit credentials.
- Confirm board/list identifiers and the credential source before live access.
- Preserve evidence for ambiguous mutations and make cleanup recovery-aware; do not hide leaked disposable resources.
- Do not release, publish, or globally install the package as part of this work.
- The CLI must only read and select existing boards; it must not create, update, close, archive, or delete boards.
- The CLI is stateless. The board identifier must be provided each time.
- Both a Trello board ID and a board name are supported as board identifiers.
- Board-name matching is exact. No match fails without mutation. Multiple exact matches fail as ambiguous and require a board ID.
- No selected-board state or configuration file may be persisted.
- The CLI encodes these canonical list names: `Inbox`, `Ready`, `In Progress`, `Review`, `Blocked`, and `Done`.
- The CLI encodes this default transition graph: Inbox to Ready; Ready to In Progress; In Progress to Review or Blocked; Review to Done or In Progress; Blocked to Ready or In Progress; Done has no outgoing transition.
- The default reconciliation source is `description`.
- Explicit environment configuration overrides built-in workflow defaults: each `TRELLO_LIST_*_ID` independently overrides only its corresponding canonical list; `TRELLO_TRANSITIONS_JSON` replaces the complete default graph; and `TRELLO_RECONCILE_SOURCE` replaces the default reconciliation source.
- A missing per-status list-ID override falls back to exact canonical-name resolution on the explicitly selected board. Duplicate canonical-name matches fail as ambiguous; no list is selected arbitrarily.
- `TRELLO_BOARD_ID` is ignored for selection. The board remains mandatory on each board-dependent invocation.
- Workflow initialization may create only missing canonical lists on the explicitly selected board. It must not automatically rename, close, replace, or reopen an existing list, and it must fail before mutation when canonical-name resolution is ambiguous or an override is invalid.
- List CRUD is permitted only on the explicitly selected board: create; read/list; update name and position; and delete by closing/archiving.
- Every list mutation supports `--dry-run`, `--operation-id`, and board-scoped read-back verification. A failed or ambiguous write must return recovery evidence and must not be blindly retried.
- Closing/archiving a configured status list that still contains cards is prohibited. The command must fail before mutation and identify the blocking card count without exposing card content or credentials.
- List mutations must reject a list ID that does not belong to the explicitly resolved board before mutation.
- Cards, checklists, and checklist items are never archived or deleted. Live-E2E card cleanup changes status only.
- Live tests are explicit opt-in and must never run as part of normal package tests or ordinary CI without the complete confirmed live configuration.
- Only cards and lists uniquely created and tagged by the current live test run may be mutated by that run. Card cleanup moves cards to the configured Done list; disposable list cleanup may close/archive only an empty run-created list after verifying it contains no cards.

## Acceptance criteria

- Every board-dependent remote command requires an explicit board selector and accepts either an existing Trello board ID or an exact board name; ambient or persisted board selection is not used.
- Board-ID resolution verifies that the board is readable by the authenticated user before any mutation.
- Exact board-name resolution succeeds only for one readable board, reports a stable no-match error for zero matches, and reports a stable ambiguity error containing safe board identity information for multiple matches.
- The CLI can list the authenticated user’s readable boards without mutating Trello and without exposing credentials.
- The CLI can list open and closed lists on the resolved board with stable IDs, names, positions, and closed state.
- Without workflow environment variables, the CLI resolves the six encoded canonical list names, uses the encoded transition graph, and reconciles from `description`.
- Per-status `TRELLO_LIST_*_ID` values independently override canonical-name resolution and must identify lists belonging to the explicitly resolved board; missing values continue to use canonical-name resolution.
- `TRELLO_TRANSITIONS_JSON` replaces the complete encoded transition graph, and `TRELLO_RECONCILE_SOURCE` replaces `description`; malformed overrides fail before access or mutation with credential-free errors.
- A guarded workflow-initialization command can dry-run and create only missing canonical lists on the explicitly resolved board, preserving existing lists and producing operation/recovery evidence under the same list-mutation safety model.
- Workflow initialization is idempotent after successful completion, fails before mutation on duplicate exact canonical names or wrong-board overrides, and never changes a board or an existing list automatically.
- The CLI can dry-run, create, read back, and verify a uniquely named list on the resolved board without affecting another board.
- The CLI can dry-run, rename, reposition, read back, and verify a selected list on the resolved board.
- The CLI can dry-run and close/archive a selected list only after verifying board ownership and that a configured status list contains no cards; it then reads back and verifies closed state.
- Exact operation replay for each list mutation returns the already verified postcondition without another write; a changed request using the same operation ID fails as a collision.
- List mutation transport failures and post-write verification failures produce stable credential-free ambiguous/partial recovery evidence containing operation ID, board ID, list ID when known, requested postcondition, and recovery action.
- List resolution and every Work Unit operation are constrained to the resolved board; supplied list IDs that do not belong to that board fail before mutation.
- A separately invoked live-E2E harness uses an explicit allowlisted board identity, uniquely tags every disposable card and list with a run ID, and asserts that all observed resources belong to that run and board.
- The live harness covers board discovery/resolution; list create/read/update/position/close; card creation/read-back/update/status transitions/reconciliation; checklist operations; and essential failures for unknown/ambiguous board name, wrong-board list, occupied configured-list close, stale version, operation replay, collision, and recovery-aware ambiguous/partial outcomes where deterministically injectable.
- Card cleanup performs status transitions only and verifies every disposable card in Done. It never archives or deletes cards/checklists and never mutates a pre-existing card.
- Disposable list cleanup closes/archives only empty lists created by the same run, after card cleanup and an empty-list read-back check. A nonempty disposable list remains visible and is reported as a leaked resource rather than force-closed.
- If cleanup cannot verify a disposable card in Done or a run-created disposable list closed, the run fails and reports a credential-free recovery record with the run ID, board ID, resource ID, current state when known, and recommended recovery action.
- Normal offline tests continue to strip ambient Trello credentials/configuration and pass without network access. Live tests use the effective built-in-or-overridden workflow configuration and skip or fail closed before access when explicit opt-in, board allowlist, effective list resolution, effective transition policy, effective reconciliation source, or credential source confirmation is absent.
- No credential value or credential-bearing URL appears in stdout, stderr, fixtures, snapshots, test reports, workflow artifacts, or committed files.

## Test seams

- Authenticated readable-board listing through the Trello transport and CLI JSON boundary.
- Board selector resolution by 24-character ID and exact name, including zero-match and duplicate-name behavior.
- Board-scoped list listing, creation, read-back, rename, position change, card-occupancy preflight, close/archive, and postcondition verification.
- Operation-ID replay/collision behavior and injected mutation/verification failures for every list mutation family.
- Board/list membership validation before Work Unit or list mutation.
- Explicit per-invocation board selection with no persisted state and no `TRELLO_BOARD_ID` fallback.
- Built-in canonical list, transition, and reconciliation defaults; independent per-list ID fallback/override behavior; whole-graph and reconciliation overrides; invalid override failures.
- Guarded workflow initialization for all-missing, partially existing, already complete, duplicate-name, wrong-board-override, dry-run, replay, collision, and ambiguous/partial recovery behavior.
- Real Bun process execution with opt-in live environment sanitization and credential-redaction assertions.
- Unique run-marker creation, board-scoped resource inventory, Work Unit operation replay, read-back verification, status-only card cleanup to Done, and empty disposable-list close.
- Existing injected-client seams for stale versions and deterministic partial/ambiguous Work Unit recovery behavior.
- Failure reporting for disposable cards not verified in Done or run-created lists not verified closed.

## Verification

- Workflow validation must prove the current artifact route at every pipeline handoff and preserve superseded contract, plan, and revision-request bytes except their status.
- Focused offline tests must prove board listing/resolution, list CRUD, per-family operation replay/collision, occupancy and board-ownership guards, required per-command selection, no state persistence, credential redaction, status-only card cleanup, and empty run-created-list close.
- An explicit live preflight must prove credential presence without printing values, authenticated identity reachability, exact allowlisted board identity, complete effective built-in-or-overridden list membership, transition policy, and reconciliation source before mutation.
- The live-E2E command must pass on the confirmed dedicated board, preserve run-scoped evidence without secrets, verify all disposable cards in Done, and verify only empty run-created disposable lists closed at exit.
- Package format, lint, typecheck, offline tests, strict package validation, repository workflow tests, living-workflow validation, and whitespace checks must pass on the final snapshot.
- Independent review must inspect the exact stable snapshot for board isolation, fail-closed name resolution, guarded list CRUD, operation identity, mutation boundaries, credential handling, ambiguous-outcome evidence, status-only card cleanup, and empty-list close behavior.

## Approval required

Yes. The contract changes public CLI behavior and configuration semantics, introduces controlled live Trello access and mutations, adds list creation/update/close operations, and defines operational cleanup behavior. Implementation requires a fresh explicit digest-bound approval record for the revised implementation plan.
