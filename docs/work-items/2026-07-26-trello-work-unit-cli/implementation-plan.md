Work item: 2026-07-26-trello-work-unit-cli
Artifact: plan
Revision: 2
Prerequisites: contract@2
Status: ready

# Preconditions

- `change-contract.md` revision 2 remains ready and unchanged.
- Root `AGENTS.md`, the monorepo work-item pipeline, and implementation-stage skill govern execution.
- The user explicitly approves this exact revision-2 plan before `approval.md` is created or product/test files change.
- Implementation uses a dedicated branch and isolated worktree from current `master`; planning artifacts are transferred only through the repository workflow's approved implementation mechanism.
- Trello credential names are available in `C:\Users\jimzord12\AppData\Local\hermes\.env`, but secrets are never copied into repository files, test fixtures, logs, snapshots, or reports.
- Trello board/list identifiers and the final transition graph remain unavailable. The implementation uses injected fake transports and fail-before-mutation configuration checks; no identifier or permissive transition is invented.
- No live card mutation occurs without explicit board/list configuration and separate authorization. A credential-only `work doctor` authentication smoke check is read-only.
- Engineering depth remains production-pragmatic. Review uses one independent wide review plus at most one focused blocking correction cycle.

## Ordered tasks

### 1. Establish the package boundary and failing public-command smoke tests

- Paths: `packages/trello-work-cli/package.json`, `packages/trello-work-cli/tsconfig.json`, `packages/trello-work-cli/jest.config.cjs`, `packages/trello-work-cli/jest-transformer.cjs`, `packages/trello-work-cli/src/bin.ts`, `packages/trello-work-cli/src/cli.test.ts`, `pnpm-lock.yaml`
- Inputs: Contract package identity, executable name, complete V1 command families, stdout/stderr rules, stable failures, and repository package conventions.
- Output: A private `@jz/ai-arsenal-trello-work-cli` workspace package exposing `work`; real-process tests enumerate the approved commands and initially fail for missing handlers.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/cli.test.ts`
- Expected result: RED—Jest and the real Bun entrypoint run successfully, while assertions fail only because approved command behavior is not implemented.
- Rollback: Not applicable.

### 2. Implement canonical Work Unit parsing, validation, rendering, and authority rules

- Paths: `packages/trello-work-cli/assets/work-unit-metadata.schema.json`, `packages/trello-work-cli/src/work-unit.ts`, `packages/trello-work-cli/src/work-unit.test.ts`, `packages/trello-work-cli/test/fixtures/valid-draft.md`, `packages/trello-work-cli/test/fixtures/invalid-draft.md`
- Inputs: Canonical fenced-YAML contract, deterministic rendering, strict field/section ordering, two-ID semantics, local/remote validation requirements, and protected system fields.
- Output: Typed fail-closed parser, validator, renderer, merge-patch authority guard, and fixtures covering valid drafts plus proportionate malformed/unsafe cases.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/work-unit.test.ts`
- Expected result: Focused cases are observed RED before implementation; the final suite passes canonical parsing/rendering and rejects every contract-listed invalid state without mutation.
- Rollback: Not applicable.

### 3. Implement configuration loading, redaction, reference parsing, and stable errors

- Paths: `packages/trello-work-cli/src/config.ts`, `packages/trello-work-cli/src/config.test.ts`, `packages/trello-work-cli/src/reference.ts`, `packages/trello-work-cli/src/reference.test.ts`, `packages/trello-work-cli/src/errors.ts`, `packages/trello-work-cli/src/errors.test.ts`
- Inputs: Process-environment and explicit Hermes `.env` loading, secret non-disclosure, unresolved board/list mappings, accepted reference formats, and stable machine-readable failure rules.
- Output: Precedence-defined safe configuration loader; complete redaction helpers; typed errors; and deterministic parsers for `WU-N`, 24-hex Trello IDs, and Trello card URLs.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/config.test.ts src/reference.test.ts src/errors.test.ts`
- Expected result: RED/GREEN cycles prove process env precedence, safe optional Hermes-env loading, missing-config failures, no secret leakage, valid reference normalization, and ambiguous/invalid reference rejection.
- Rollback: Not applicable.

### 4. Implement the injected Trello REST API v1 transport

- Paths: `packages/trello-work-cli/src/trello-client.ts`, `packages/trello-work-cli/src/trello-client.test.ts`, `packages/trello-work-cli/src/trello-types.ts`
- Inputs: Trello API v1 key/token authentication, native HTTP boundary, normalized responses, timeout/network/API failures, redaction, request observability, and injected fake transport seam.
- Output: A typed Trello client for boards, lists, cards, descriptions, movement, checklists, checklist items, and read-back operations, with no direct dependency from domain logic on global `fetch`.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/trello-client.test.ts`
- Expected result: Injected transport tests prove exact v1 methods, URLs, parameters, normalized responses, timeout/API error mapping, and complete credential redaction without contacting Trello.
- Rollback: Not applicable.

### 5. Implement shared command metadata and comprehensive offline `work docs`

- Paths: `packages/trello-work-cli/src/command-catalog.ts`, `packages/trello-work-cli/src/docs.ts`, `packages/trello-work-cli/src/docs.test.ts`, `packages/trello-work-cli/assets/work-guide.md`
- Inputs: Every approved command and option, complete-guide requirement, topic/list/search/text/JSON modes, recommended workflows, examples, configuration, safety, errors, and recovery guidance.
- Output: One typed command catalog shared by short help and docs; a packaged, version-matched full guide; deterministic complete-text, topic, list, search, and structured JSON renderers.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/docs.test.ts`
- Expected result: RED/GREEN cycles prove default docs cover every catalog command, examples and recommended workflows are present, topic/search behavior is deterministic, JSON is structured rather than one blob, and secret values cannot enter output.
- Rollback: Not applicable.

### 6. Implement read-only `doctor`, local/remote `validate`, `get`, and filtered `list`

- Paths: `packages/trello-work-cli/src/read-commands.ts`, `packages/trello-work-cli/src/read-commands.test.ts`, `packages/trello-work-cli/src/cli.ts`, `packages/trello-work-cli/src/cli.test.ts`
- Inputs: Credential/authentication diagnostics, board/list mapping checks, accepted references, normalized Work Units, list filters, read-only validation, JSON output, and no-mutation guarantees.
- Output: `work doctor`; `work validate --file`; `work validate <reference>`; `work get`; and `work list` with status/type/priority/owner/parent/label filters, all implemented through injected clients.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/read-commands.test.ts src/cli.test.ts`
- Expected result: Fake-client and real-process tests pass for successful reads, missing configuration, invalid references, filter serialization, malformed remote cards, redaction, JSON stdout, diagnostics stderr, stable exits, and zero mutations.
- Rollback: Not applicable.

### 7. Implement mutation planning, concurrency, operation identity, and verification primitives

- Paths: `packages/trello-work-cli/src/mutation.ts`, `packages/trello-work-cli/src/mutation.test.ts`, `packages/trello-work-cli/src/version.ts`, `packages/trello-work-cli/src/version.test.ts`
- Inputs: `--dry-run`, `--if-version`, `--operation-id`, current/proposed validation, idempotency, ambiguous outcomes, minimum operations, read-back verification, and recovery evidence.
- Output: Reusable typed mutation plans and executor primitives that reject stale versions before mutation, preserve operation IDs, separate dry-run from execution, and return explicit verified/partial/ambiguous outcomes.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/mutation.test.ts src/version.test.ts`
- Expected result: RED/GREEN cycles prove dry runs make zero transport calls, stale versions prevent writes, duplicate operation IDs reconcile rather than recreate, and read-back mismatches return stable recovery data.
- Rollback: Not applicable.

### 8. Implement verified Inbox creation and `idShort` allocation

- Paths: `packages/trello-work-cli/src/create.ts`, `packages/trello-work-cli/src/create.test.ts`, `packages/trello-work-cli/src/cli.ts`, `packages/trello-work-cli/src/cli.test.ts`
- Inputs: File/stdin draft sources, board/Inbox requirements, unique operation IDs, exactly-one-card creation, `WU-<idShort>`, persisted IDs/timestamps, read-back verification, and no blind retry.
- Output: `work create --file` and `work create --stdin`, including deterministic dry-run plans, fail-before-mutation missing configuration, fake-client live execution, and ambiguous-create recovery.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/create.test.ts src/cli.test.ts`
- Expected result: Tests prove no dry-run mutation, exactly one fake Trello create, correct `idShort` derivation without prediction, final-description update, read-back verification, and recovery without duplicate creation after ambiguous failure.
- Rollback: Not applicable.

### 9. Implement metadata and description mutations

- Paths: `packages/trello-work-cli/src/update.ts`, `packages/trello-work-cli/src/update.test.ts`, `packages/trello-work-cli/src/cli.ts`, `packages/trello-work-cli/src/cli.test.ts`
- Inputs: JSON/file merge patch, protected fields, complete resulting-object validation, full description replacement, safe section patching, dry-run/version/operation options, and read-back verification.
- Output: `work metadata update`, `work description replace`, and `work description patch` with fail-closed authority and structure enforcement.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/update.test.ts src/cli.test.ts`
- Expected result: Tests pass for supported updates and reject unknown fields, status/system-field changes, malformed documents, duplicate/unknown sections, stale versions, and partial read-back mismatches before reporting success.
- Rollback: Not applicable.

### 10. Implement explicit transitions and reconciliation without inventing policy

- Paths: `packages/trello-work-cli/src/transition.ts`, `packages/trello-work-cli/src/transition.test.ts`, `packages/trello-work-cli/src/reconcile.ts`, `packages/trello-work-cli/src/reconcile.test.ts`, `packages/trello-work-cli/src/cli.ts`
- Inputs: Replaceable configured transition graph, status/list synchronization, unsupported-transition failure, deterministic reconciliation source-of-truth configuration, dry-run repair plans, partial outcomes, and read-back verification.
- Output: `work transition` and `work reconcile` handlers that remain inert without required mappings/policy and become fully testable through injected configuration and fake Trello state.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/transition.test.ts src/reconcile.test.ts`
- Expected result: Tests prove valid configured transitions update both representations and verify them; unsupported or unconfigured transitions fail before mutation; reconciliation detects drift, previews repairs, applies configured policy only, and reports partial outcomes.
- Rollback: Not applicable.

### 11. Implement basic checklist operations

- Paths: `packages/trello-work-cli/src/checklist.ts`, `packages/trello-work-cli/src/checklist.test.ts`, `packages/trello-work-cli/src/cli.ts`, `packages/trello-work-cli/src/cli.test.ts`
- Inputs: Stable Trello checklist/item IDs, list/create/update/item checked-state operations, common mutation safety options, read-back verification, and no automatic generation policy.
- Output: `work checklist list`, `create`, `update`, and `item set --checked|--unchecked` through the shared Trello/mutation boundaries.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/checklist.test.ts src/cli.test.ts`
- Expected result: Tests pass for basic checklist behavior and reject display-name-only addressing, stale versions, invalid payloads, missing configuration, and verification mismatches; no automatic checklist is created.
- Rollback: Not applicable.

### 12. Complete package documentation and package-boundary verification

- Paths: `packages/trello-work-cli/README.md`, `packages/trello-work-cli/package.json`, `packages/trello-work-cli/src/cli.test.ts`
- Inputs: Skill/CLI responsibility boundary, canonical contract, full V1 surface, Trello/Hermes configuration, `idShort` rationale, safety/recovery rules, docs command, and intentional package contents.
- Output: Concise package README complementing—not duplicating—the comprehensive `work docs` guide; final package scripts and packed-file declaration.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli format && pnpm --filter @jz/ai-arsenal-trello-work-cli lint && pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck && pnpm --filter @jz/ai-arsenal-trello-work-cli test && pnpm --filter @jz/ai-arsenal-trello-work-cli validate`
- Expected result: Every package-local gate exits 0, packed documentation/assets are present, fixtures/config/secrets are excluded, and real-process docs/doctor/local-validation smoke tests pass without mutation.
- Rollback: Not applicable.

### 13. Freeze and independently review the implementation snapshot

- Paths: `packages/trello-work-cli/**`, `pnpm-lock.yaml`
- Inputs: Complete revision-2 contract mapping, green focused/package gates, exact staged diff, secret scan, and bounded review rules.
- Output: One independent correctness/security/contract review of the frozen snapshot; blocking findings, if any, receive one focused TDD correction and fresh review.
- Test command: `git diff --cached --check`
- Expected result: No whitespace or credential leakage; independent PASS on the exact staged snapshot, or one bounded blocking correction routed through focused RED/GREEN verification and review.
- Rollback: Not applicable.

### 14. Run aggregate repository verification

- Paths: `packages/trello-work-cli/**`, `pnpm-lock.yaml`
- Inputs: Independently accepted package snapshot and repository verification contract.
- Output: Grounded evidence that the new package satisfies V1 through deterministic fake-transport/process tests and does not regress existing packages or workflow state.
- Test command: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm test:workflow && pnpm validate:workflow && git diff --cached --check`
- Expected result: Every command exits 0, including existing package tests and both workflow validators; no live Trello mutation is performed.
- Rollback: Not applicable.

## Affected paths

- Create: `packages/trello-work-cli/package.json`
- Create: `packages/trello-work-cli/tsconfig.json`
- Create: `packages/trello-work-cli/jest.config.cjs`
- Create: `packages/trello-work-cli/jest-transformer.cjs`
- Create: `packages/trello-work-cli/assets/work-unit-metadata.schema.json`
- Create: `packages/trello-work-cli/assets/work-guide.md`
- Create: `packages/trello-work-cli/src/bin.ts`
- Create: `packages/trello-work-cli/src/cli.ts`
- Create: `packages/trello-work-cli/src/cli.test.ts`
- Create: `packages/trello-work-cli/src/command-catalog.ts`
- Create: `packages/trello-work-cli/src/config.ts`
- Create: `packages/trello-work-cli/src/config.test.ts`
- Create: `packages/trello-work-cli/src/errors.ts`
- Create: `packages/trello-work-cli/src/errors.test.ts`
- Create: `packages/trello-work-cli/src/reference.ts`
- Create: `packages/trello-work-cli/src/reference.test.ts`
- Create: `packages/trello-work-cli/src/work-unit.ts`
- Create: `packages/trello-work-cli/src/work-unit.test.ts`
- Create: `packages/trello-work-cli/src/trello-types.ts`
- Create: `packages/trello-work-cli/src/trello-client.ts`
- Create: `packages/trello-work-cli/src/trello-client.test.ts`
- Create: `packages/trello-work-cli/src/docs.ts`
- Create: `packages/trello-work-cli/src/docs.test.ts`
- Create: `packages/trello-work-cli/src/read-commands.ts`
- Create: `packages/trello-work-cli/src/read-commands.test.ts`
- Create: `packages/trello-work-cli/src/mutation.ts`
- Create: `packages/trello-work-cli/src/mutation.test.ts`
- Create: `packages/trello-work-cli/src/version.ts`
- Create: `packages/trello-work-cli/src/version.test.ts`
- Create: `packages/trello-work-cli/src/create.ts`
- Create: `packages/trello-work-cli/src/create.test.ts`
- Create: `packages/trello-work-cli/src/update.ts`
- Create: `packages/trello-work-cli/src/update.test.ts`
- Create: `packages/trello-work-cli/src/transition.ts`
- Create: `packages/trello-work-cli/src/transition.test.ts`
- Create: `packages/trello-work-cli/src/reconcile.ts`
- Create: `packages/trello-work-cli/src/reconcile.test.ts`
- Create: `packages/trello-work-cli/src/checklist.ts`
- Create: `packages/trello-work-cli/src/checklist.test.ts`
- Create: `packages/trello-work-cli/test/fixtures/valid-draft.md`
- Create: `packages/trello-work-cli/test/fixtures/invalid-draft.md`
- Create: `packages/trello-work-cli/README.md`
- Modify: `pnpm-lock.yaml`

Implementation-stage and later pipeline evidence will create their governed files under `docs/work-items/2026-07-26-trello-work-unit-cli/`. Final reconciliation—not this planning stage—updates the canonical living plan and the non-routing content of `NEXT.md`.

## Verification commands

- `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/work-unit.test.ts` — canonical parser/renderer/authority suite passes after observed RED/GREEN cycles.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/config.test.ts src/reference.test.ts src/errors.test.ts` — configuration, redaction, references, and stable errors pass.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/trello-client.test.ts` — exact injected Trello API v1 transport behavior passes without network access.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/docs.test.ts` — complete offline docs, topics, search, workflows, examples, and structured JSON pass.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/read-commands.test.ts src/cli.test.ts` — doctor/get/list/local-remote validate and real-process behavior pass.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/mutation.test.ts src/version.test.ts` — dry-run, optimistic concurrency, operation IDs, verification, and partial outcomes pass.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/create.test.ts src/update.test.ts` — verified create, metadata, and description mutation behavior passes through fake transport.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test -- --runTestsByPath src/transition.test.ts src/reconcile.test.ts src/checklist.test.ts` — configured transition/reconciliation and basic checklist behavior pass without invented policy.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli format` — package formatting exits 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli lint` — package lint exits 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck` — strict TypeScript exits 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test` — complete package suite exits 0 without live mutation.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — strict package and packed-boundary validation exits 0.
- `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm test:workflow && pnpm validate:workflow` — aggregate repository gates exit 0.
- `git diff --cached --check` — frozen final snapshot has no whitespace errors.

## Rollback

Not applicable. This plan adds source, tests, packaged offline documentation, and workspace lockfile metadata. It performs no authorized live Trello mutation, release, installation, commit, push, or other stateful external action.
