Work item: 2026-07-28-trello-cli-onboarding-fixes
Artifact: plan
Revision: 3
Prerequisites: contract@2
Status: ready

# Preconditions

- `change-contract.md` revision 2 is ready and remains the complete scope authority.
- Root `AGENTS.md`, the monorepo work-item pipeline, and applicable package evidence remain authoritative.
- Implementation is blocked until the exact bytes of this plan receive explicit user approval and `record-monorepo-approval` records the digest.
- Baseline is clean `master` at `eacd7613e63d34111e2d002eb8b742004f499fff`, equal to `origin/master`, apart from this work item's planning artifacts and `NEXT.md` route.
- Trello credentials remain process-environment-only. Offline RED/GREEN work must not load or use live credentials.
- The post-capture operational workbook is separately bounded to TestingBoard `6a16bbf1fea5389eb39636b7`; repository implementation and verification remain offline. The user reports that TestingBoard currently contains only six empty canonical lists, and the seventh In Design list may be initialized only during the later operational run after complete preflight.
- Engineering depth is Tier 2: supported happy paths, basic failures, maintainable code, and essential gates without an exhaustive hypothetical matrix.

## Ordered tasks

### 1. Correct planned mutation output validation

- Paths: `packages/trello-work-cli/src/cli.test.ts`, `packages/trello-work-cli/src/cli.ts`
- Inputs: Acceptance criterion for metadata/description dry runs; `mutationCliResult` and `mutateDescription` evidence.
- Output: A focused regression proves that a valid `planned` mutation carrying `proposed` renders successfully while malformed outcomes still fail closed.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/cli.test.ts`
- Expected result: The new regression fails with `MUTATION_INVALID_OUTCOME` before the source change, then passes after the smallest output-validator correction; existing invalid-outcome tests remain green.
- Rollback: Not applicable.

### 2. Add In Design domain and seven-list workflow rules

- Paths: `packages/trello-work-cli/src/work-unit.test.ts`, `packages/trello-work-cli/src/config.test.ts`, `packages/trello-work-cli/src/transition.test.ts`, `packages/trello-work-cli/src/board.test.ts`, `packages/trello-work-cli/src/work-unit.ts`, `packages/trello-work-cli/src/config.ts`, `packages/trello-work-cli/src/transition.ts`, `packages/trello-work-cli/assets/work-unit-metadata.schema.json`
- Inputs: In Design canonical-structure decision, Open Questions/pending-content policy, seven-list acceptance criteria, and transition seams.
- Output: `in_design` is a schema-valid status mapped to canonical `In Design`; defaults and overrides cover seven lists; the transition graph supports In Design to Ready while Ready validation rejects unresolved pending content or material Open Questions.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/work-unit.test.ts src/config.test.ts src/transition.test.ts src/board.test.ts`
- Expected result: Focused RED tests first expose the six-status and Inbox-only assumptions; GREEN proves canonical partial In Design parsing and strict Ready entry without weakening later transitions.
- Rollback: Not applicable.

### 3. Classify and list mixed Inbox content safely

- Paths: `packages/trello-work-cli/src/read-commands.test.ts`, `packages/trello-work-cli/src/read-commands.ts`
- Inputs: Ordinary Inbox-card validity, Draft Work Unit intake, `work inbox list`, valid Work Unit listing, and malformed claimed-Work-Unit handling.
- Output: Read commands distinguish ordinary cards, valid Work Units, and cards that claim Work Unit identity but are malformed; Inbox listing returns ordinary cards and drafts; Work Unit listing skips clearly ordinary Inbox cards, includes In Design Work Units, and identifies malformed claimed Work Units.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/read-commands.test.ts`
- Expected result: Mixed-card regressions fail against all-cards normalization, then pass with deterministic classification and no silent corruption hiding.
- Rollback: Not applicable.

### 4. Introduce in-place design start with durable mutation safety

- Paths: `packages/trello-work-cli/src/design.test.ts`, `packages/trello-work-cli/src/design.ts`, `packages/trello-work-cli/src/trello-types.ts`
- Inputs: Same-card conversion hard wall; ordinary-card and Draft Work Unit entry paths; dry-run/version/operation-ID/recovery/read-back requirements.
- Output: One production handler converts an ordinary Inbox card using a canonical partial document or promotes a valid Draft Work Unit, preserves the card ID, moves it to In Design, and implements planned, verified, recovered, collision/partial, stale-version, ambiguous, and read-back verification outcomes.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/design.test.ts`
- Expected result: Vertical RED/GREEN slices prove both input families, same-card identity, wrong-list refusal, exact replay, changed-intent collision, and post-write recovery without creating a second card.
- Rollback: Not applicable.

### 5. Expose draft and design commands through the real CLI

- Paths: `packages/trello-work-cli/src/command-catalog.ts`, `packages/trello-work-cli/src/cli.ts`, `packages/trello-work-cli/src/create.ts`, `packages/trello-work-cli/src/create.test.ts`, `packages/trello-work-cli/src/cli.test.ts`, `packages/trello-work-cli/package.json`
- Inputs: Approved `work draft create`, deprecated `work create` alias, `work inbox list`, and `work design start` public behavior.
- Output: Strict parsing/routes expose the new command family; draft creation remains Inbox-scoped and recovery-aware; the alias emits a non-secret deprecation warning without changing JSON success data; design start calls the production handler; the packed boundary includes `src/design.ts`.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/create.test.ts src/cli.test.ts src/design.test.ts src/read-commands.test.ts`
- Expected result: Real routing tests prove valid syntax, required board/file/version/operation inputs, stdout/stderr separation, alias warning, and stable errors for unsupported or ambiguous requests.
- Rollback: Not applicable.

### 6. Update workflow initialization, diagnostics, and offline guidance

- Paths: `packages/trello-work-cli/src/list-management.test.ts`, `packages/trello-work-cli/src/list-management.ts`, `packages/trello-work-cli/src/docs.test.ts`, `packages/trello-work-cli/assets/work-guide.md`, `packages/trello-work-cli/README.md`
- Inputs: Seven canonical lists, new lifecycle/commands, credential and mutation hard walls, and workbook-facing operator guidance.
- Output: Initialization and doctor/list mapping behavior recognize In Design; version-matched documentation explains both Inbox entry paths, partial-versus-Ready rules, command examples, alias deprecation, safety, and recovery.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/list-management.test.ts src/docs.test.ts src/config.test.ts`
- Expected result: Focused tests prove initialization creates only a missing In Design list, preserves all existing lists, and packaged docs/catalog remain synchronized.
- Rollback: Not applicable.

### 7. Create the corrected onboarding workbook and offline fixtures

- Paths: `docs/operations/trello-work-cli-onboarding-workbook.md`, `packages/trello-work-cli/test/fixtures/valid-draft.md`, `packages/trello-work-cli/test/fixtures/valid-in-design.md`
- Inputs: Corrected lifecycle acceptance criterion, original workbook failure evidence, both intake paths, and canonical partial-format decision.
- Output: A durable workbook explicitly preflights a clean TestingBoard, initializes In Design, exercises one ordinary Inbox conversion plus one agent-created Draft Work Unit without contradictory edit restrictions, completes supported paths to Done, and cleans only run-owned disposable resources; fixtures separately represent Inbox draft and In Design partial states.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/work-unit.test.ts src/create.test.ts src/design.test.ts src/docs.test.ts`
- Expected result: Fixture and documentation tests prove the workbook inputs validate at the intended stage and no In Design document is incorrectly treated as Ready.
- Rollback: Not applicable.

### 8. Extend the bounded live harness without executing external mutations

- Paths: `packages/trello-work-cli/test/live-trello.e2e.test.ts`
- Inputs: TestingBoard allowlist, production-path criteria, operation recovery rules, both intake paths, seven-list initialization, cleanup boundaries, and the post-capture operational contract.
- Output: The explicit live harness is updated for exact board identity, the missing canonical In Design list, run-tagged ordinary-card conversion and Draft Work Unit promotion, Ready gating, supported completion to Done, and cleanup postconditions; repository stages do not enable or execute it.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath test/live-trello.e2e.test.ts`
- Expected result: The harness parses and remains skipped without its explicit live opt-in; no credentials are loaded and no Trello mutation occurs during repository implementation or verification.
- Rollback: Not applicable inside the repository workflow. The later post-capture workbook owns its run-tagged recovery procedure.

### 9. Run aggregate gates and freeze an independently reviewed snapshot

- Paths: `packages/trello-work-cli/src/cli.ts`, `packages/trello-work-cli/src/cli.test.ts`, `packages/trello-work-cli/src/work-unit.ts`, `packages/trello-work-cli/src/work-unit.test.ts`, `packages/trello-work-cli/src/config.ts`, `packages/trello-work-cli/src/config.test.ts`, `packages/trello-work-cli/src/board.test.ts`, `packages/trello-work-cli/src/transition.ts`, `packages/trello-work-cli/src/transition.test.ts`, `packages/trello-work-cli/src/read-commands.ts`, `packages/trello-work-cli/src/read-commands.test.ts`, `packages/trello-work-cli/src/design.ts`, `packages/trello-work-cli/src/design.test.ts`, `packages/trello-work-cli/src/create.ts`, `packages/trello-work-cli/src/create.test.ts`, `packages/trello-work-cli/src/command-catalog.ts`, `packages/trello-work-cli/src/trello-types.ts`, `packages/trello-work-cli/src/list-management.ts`, `packages/trello-work-cli/src/list-management.test.ts`, `packages/trello-work-cli/src/docs.test.ts`, `packages/trello-work-cli/assets/work-guide.md`, `packages/trello-work-cli/assets/work-unit-metadata.schema.json`, `packages/trello-work-cli/test/fixtures/valid-draft.md`, `packages/trello-work-cli/test/fixtures/valid-in-design.md`, `packages/trello-work-cli/test/live-trello.e2e.test.ts`, `packages/trello-work-cli/README.md`, `packages/trello-work-cli/package.json`, `docs/operations/trello-work-cli-onboarding-workbook.md`
- Inputs: Every contract acceptance criterion/test seam and the stable implementation snapshot.
- Output: All required gates pass, no tarball or credential artifact remains, and one fresh independent reviewer reports no unresolved Critical or High correctness/safety finding on the exact frozen snapshot.
- Test command: Implementation runs `pnpm --filter @jz/ai-arsenal-trello-work-cli validate`, immediately removes generated tarballs, and proves repository tarball count zero. Repository verification separately runs the stage-permitted offline commands listed below, `git diff --check`, and changed-path inspection without repeating packing.
- Expected result: Strict publint implementation evidence passes with zero retained tarballs; every stage-permitted verification command exits zero; Git changes match the affected-path allowlist; independent exact-snapshot review has no unresolved Critical or High finding.
- Rollback: Not applicable.

## Affected paths

### Create

- `packages/trello-work-cli/src/design.ts`
- `packages/trello-work-cli/src/design.test.ts`
- `packages/trello-work-cli/test/fixtures/valid-in-design.md`
- `docs/operations/trello-work-cli-onboarding-workbook.md`

### Modify

- `packages/trello-work-cli/src/cli.ts`
- `packages/trello-work-cli/src/cli.test.ts`
- `packages/trello-work-cli/src/work-unit.ts`
- `packages/trello-work-cli/src/work-unit.test.ts`
- `packages/trello-work-cli/src/config.ts`
- `packages/trello-work-cli/src/config.test.ts`
- `packages/trello-work-cli/src/board.test.ts`
- `packages/trello-work-cli/src/transition.ts`
- `packages/trello-work-cli/src/transition.test.ts`
- `packages/trello-work-cli/src/read-commands.ts`
- `packages/trello-work-cli/src/read-commands.test.ts`
- `packages/trello-work-cli/src/create.ts`
- `packages/trello-work-cli/src/create.test.ts`
- `packages/trello-work-cli/src/command-catalog.ts`
- `packages/trello-work-cli/src/trello-types.ts`
- `packages/trello-work-cli/src/list-management.ts`
- `packages/trello-work-cli/src/list-management.test.ts`
- `packages/trello-work-cli/src/docs.test.ts`
- `packages/trello-work-cli/assets/work-guide.md`
- `packages/trello-work-cli/assets/work-unit-metadata.schema.json`
- `packages/trello-work-cli/test/fixtures/valid-draft.md`
- `packages/trello-work-cli/test/live-trello.e2e.test.ts`
- `packages/trello-work-cli/README.md`
- `packages/trello-work-cli/package.json`

### Delete

- None.

## Verification commands

1. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/cli.test.ts` — planned-proposal RED/GREEN and CLI output contract pass.
2. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/work-unit.test.ts src/config.test.ts src/transition.test.ts src/board.test.ts` — In Design schema, seven-list mapping, board resolution, and Ready gating pass.
3. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/read-commands.test.ts` — mixed Inbox classification/listing pass.
4. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/design.test.ts` — in-place design lifecycle and recovery pass.
5. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/create.test.ts src/cli.test.ts src/design.test.ts src/read-commands.test.ts` — draft/create alias and real command routing pass.
6. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath src/list-management.test.ts src/docs.test.ts src/config.test.ts` — initialization/diagnostics/docs pass.
7. `pnpm --filter @jz/ai-arsenal-trello-work-cli format` — package formatting exits zero.
8. `pnpm --filter @jz/ai-arsenal-trello-work-cli lint` — package lint exits zero.
9. `pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck` — strict package typecheck exits zero.
10. `pnpm --filter @jz/ai-arsenal-trello-work-cli test` — complete offline package suite exits zero with the live suite ordinarily skipped.
11. `pnpm format && pnpm lint && pnpm typecheck && pnpm test` — repository aggregate gates exit zero.
12. `pnpm test:workflow && node scripts/validate-living-workflow.mjs` — workflow suites and living-plan structure exit zero.
13. `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --runTestsByPath test/live-trello.e2e.test.ts` — the live harness parses and skips without explicit live opt-in, proving repository verification performs no external mutation.
14. `git diff --check` — changed lines have no whitespace errors.
15. Changed-path comparison against this affected-path allowlist and `implementation-report.md` — no out-of-scope or unreported product path exists.
16. `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-28-trello-cli-onboarding-fixes --json` — implementation handoff remains structurally valid at each governed stage.

## Post-capture operational follow-up

- Only after repository reconciliation, independent review, commit, push/capture, and clean-state proof, globally install the exact committed local package and execute `docs/operations/trello-work-cli-onboarding-workbook.md` against TestingBoard `6a16bbf1fea5389eb39636b7`.
- This operation is outside repository acceptance and verification. It must use process-only credentials, preserve canonical lists, create or mutate only run-owned resources plus the required canonical In Design list, and retain credential-free recovery evidence if cleanup cannot be established.

## Rollback

- Source, tests, fixtures, schema, and documentation changes are reversed together before any release or global installation.
- If the authorized live run creates the canonical In Design list, retain it because it is required workflow state; do not close or delete canonical lists during rollback.
- For a failed live run, use only the run-owned recovery sequence defined in task 8; never archive/delete cards or mutate another board to simulate rollback.
