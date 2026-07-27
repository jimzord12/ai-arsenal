Work item: 2026-07-26-trello-work-unit-cli
Artifact: contract
Revision: 2
Prerequisites: request@1,context@1
Status: ready

# Goal

Create a private TypeScript package, `@jz/ai-arsenal-trello-work-cli`, exposing the `work` executable and implementing a genuine Trello REST API v1 Work Unit CLI. V1 must provide deterministic local validation, authenticated Trello reads and safe verified mutations, recovery-aware status/list synchronization, basic checklist management, machine-readable automation, diagnostics, and comprehensive version-matched offline documentation.

## Non-goals

- Bulk mutation, AI planning, automatic Slice decomposition, GitHub synchronization, automatic estimation, deletion, or composite scoring.
- Automatic checklist generation by Work Unit type or engineering depth.
- Inventing the still-unknown Trello board ID, list IDs, or final transition state machine.
- npm publication, package release, packing for distribution, global installation, commit, or push.
- Modifying either installed Hermes planning-skill package during this work item.

## Hard walls

- Package location: `packages/trello-work-cli` in the existing pnpm/Turborepo monorepo.
- Language: TypeScript.
- Package name: `@jz/ai-arsenal-trello-work-cli`; executable: `work`.
- The staged planner V1.1 fenced-YAML document is the canonical baseline: exactly one `# Work Unit`, one immediately following fenced `yaml` block, canonical metadata field order, and required sections in order.
- `parent` and `blocked_by` contain Work Unit IDs (`WU-N`), not Trello card IDs.
- Draft IDs and timestamps are null; persisted IDs are paired. `trello_card_id` is a 24-character hexadecimal Trello ID.
- `status`, IDs, and timestamps are system-managed and cannot be changed through a generic metadata patch. Status changes use only `work transition` and synchronize metadata with the mapped Trello list.
- V1 communicates with the Trello REST API v1. Normal requests authenticate with `TRELLO_API_KEY` and `TRELLO_API_TOKEN`; secret values must never appear in output, diagnostics, errors, or fixtures. `TRELLO_API_SECRET` is not sent with ordinary key/token API requests.
- Hermes credentials are currently stored in `C:\Users\jimzord12\AppData\Local\hermes\.env`. The CLI must support injected process environment variables and an explicit safe Hermes-env loading path rather than assuming a working-directory `.env`.
- The Trello board/list configuration remains unresolved. Commands requiring it must fail before mutation with a stable error until configured; planning and implementation must not invent identifiers.
- Every `<reference>` operand accepts a Work Unit ID (`WU-N`), Trello card ID, or Trello card URL and resolves ambiguity deterministically.
- Every command supports `--output json`; machine-readable output goes to stdout, diagnostics go to stderr, and failures use stable codes and nonzero exit statuses.
- Every mutating command supports `--dry-run`, `--if-version <version>`, and `--operation-id <id>`. Dry runs perform no mutation. Stale versions fail before mutation. Operation IDs support idempotency and recovery.
- Work Unit IDs use Trello's server-assigned, board-scoped sequential `idShort`: after card creation, `id = "WU-" + idShort`. Gaps from deleted cards are acceptable and IDs are never reused.
- Live creation creates exactly one Inbox card, preserves a unique operation identifier, derives `WU-N` from returned `idShort`, persists IDs/timestamps, reads back, verifies, and never blindly recreates after an ambiguous partial failure.
- `work reconcile` is retained as the explicit recovery boundary for representation drift and partial Trello outcomes; it must expose planned repairs in dry-run mode.
- `work validate` remains read-only in both local-file and remote-card forms.
- `work docs` ships inside the package, works offline, and remains version-matched with the installed CLI. It explains every command, recommended workflows, examples, configuration, safety, errors, and recovery without requiring a browser.
- Keep engineering depth production-pragmatic: supported happy paths, realistic failures, maintainable code, and essential gates without exhaustive matrices or speculative infrastructure.

## Acceptance criteria

- The new workspace package participates in root formatting, linting, typechecking, and tests with an intentional packed boundary.
- A valid canonical Work Unit Markdown file parses into typed metadata and ordered sections and renders deterministically without changing meaning.
- Invalid documents fail closed for malformed/unsafe YAML, unknown or duplicate fields, noncanonical field order, invalid enums/types/IDs/timestamps, duplicate relationship values, self-reference, mismatched ID pairing, forbidden legacy fields, missing/duplicate/out-of-order/empty sections, and invalid `Open Questions` usage.
- Draft validation requires `status: inbox`, null IDs, and null timestamps.
- V1 exposes these command families:
  - `work get <reference>`;
  - `work list` with status, type, priority, owner, parent, and label filters;
  - `work create --file <work-unit.md>` and `work create --stdin`;
  - `work metadata update <reference> --json <merge-patch>` and `--file <patch.json>`;
  - `work description replace <reference> --file <description.md>`;
  - `work description patch <reference> --section <section> --file <content.md>`;
  - `work transition <reference> <target-status>`;
  - `work reconcile <reference>`;
  - `work validate --file <work-unit.md>` and `work validate <reference>`;
  - `work checklist list`, `create`, `update`, and `item set --checked|--unchecked` using stable Trello checklist/item IDs;
  - `work doctor`;
  - `work docs`, `work docs --list`, `work docs --topic <topic>`, `work docs --search <query>`, and `work docs --output text|json`.
- `work doctor` safely reports credential availability, Trello authentication reachability, board/list configuration, required list presence, and status-to-list mapping validity without exposing secrets or mutating Trello.
- `work get` and `work list` communicate with Trello API v1 and return normalized Work Unit representations with stable JSON output.
- Each mutating command validates current and proposed state, enforces authority, applies optimistic concurrency when requested, performs the minimum Trello v1 operations, reads back, verifies postconditions, and returns recovery data on partial or ambiguous failure.
- `work create --dry-run` reports the validated draft, intended Inbox transaction, unresolved configuration, operation identity, and `idShort` strategy without predicting a future `WU-N` or mutating Trello.
- Metadata merge-patch rejects unknown fields and all attempts to alter status, IDs, or timestamps; resulting complete metadata is validated before mutation.
- Description replacement and section patching reject malformed documents, duplicate/unknown sections, invalid metadata, and unsafe status/system-field changes.
- Transition rules are explicit and replaceable. Until the final state machine is supplied, unsupported transitions fail closed; no permissive transition graph is invented.
- Reconciliation detects status/list and description/metadata disagreement, provides a deterministic dry-run repair plan, and applies only an explicitly supported source-of-truth policy.
- Local and remote validation are read-only and return structured findings.
- Checklist operations address checklists and items by stable Trello IDs; no automatic checklist policy is introduced.
- Default `work docs` prints the complete offline guide. Topic, list, search, text, and structured JSON modes are deterministic and tested. The guide covers concepts, all syntax/options, output and exit behavior, recommended human/agent workflows, configuration, credential safety, dry-run/concurrency/idempotency, examples, expected failures, and recovery.
- CLI short help and the full docs command derive from shared command metadata where practical so syntax and option descriptions cannot silently drift.
- CLI help, docs, authentication/configuration failures, API failures, JSON stdout, stderr separation, and exit behavior are tested at the real process boundary.

## Test seams

- Pure safe-metadata token parsing, schema validation, Work Unit structure parsing, deterministic rendering, and authority enforcement.
- Reference parsing and resolution for `WU-N`, Trello card ID, and Trello card URL.
- Environment/config loading and secret-redaction behavior.
- Trello REST API v1 transport behind an injected fake for deterministic request, response, timeout, retry-safety, and partial-failure tests.
- Dry-run planning, optimistic version checks, operation-id idempotency, read-back verification, and reconciliation planning.
- Command handlers for get/list/create/update/description/transition/reconcile/validate/checklist/doctor/docs.
- Shared command documentation model, complete text rendering, topic/search selection, and structured JSON rendering.
- CLI argument parsing, JSON stdout, stderr separation, stable codes, and exit statuses through the real executable process.
- Optional credential-only live smoke verification may prove authentication without creating or modifying cards; live mutation verification waits for explicit board/list configuration and authorization.
- Root Turbo participation and package-local quality/package-boundary commands.

## Verification

- Focused Jest tests must first fail for each new behavior and then pass under package-local execution.
- Package formatting, ESLint, strict TypeScript, Jest, strict package validation, and packed-content inspection must pass.
- Root `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, workflow tests, and workflow validators must pass on the final snapshot.
- Real-process fixtures must prove local validation, comprehensive offline docs, doctor redaction/failure behavior, dry-run non-mutation, stable JSON/errors, and no accidental external effects.
- Injected Trello transport tests must prove exact API v1 request construction, reference resolution, authority enforcement, status/list coordination, read-back verification, checklist addressing, concurrency rejection, operation-id recovery, and fail-closed partial outcomes.
- Live authentication or mutation evidence must be clearly separated from deterministic tests. No card mutation is performed without the final board/list configuration and explicit authorization.

## Approval required

Yes. Revision 2 expands the public V1 command surface from an offline creation slice to a Trello-connected Work Unit CLI and adds the offline `work docs` and diagnostic `work doctor` commands. The exact revision-2 implementation plan requires fresh explicit user approval before product or test files change.
