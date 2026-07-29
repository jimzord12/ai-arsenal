Work item: 2026-07-29-fetch-trello-card-attachments
Artifact: plan
Revision: 1
Prerequisites: contract@1
Status: ready

# Preconditions

- Contract revision 1 is ready and validator-routed to planning.
- Root/pipeline instructions and attachment-relevant source, tests, docs, and package manifest are authoritative.
- Use strict vertical-slice TDD: each behavior test must fail for the missing behavior before production code is changed.
- No live Trello mutation, global installation, publication, source deletion, or credential persistence is authorized.
- Implementation remains blocked until this exact plan is approved and digest-bound.

## Ordered tasks

### 1. Add typed attachment metadata and Trello API support

- Paths: `packages/trello-work-cli/src/trello-types.ts`, `packages/trello-work-cli/src/trello-client.ts`, `packages/trello-work-cli/src/trello-client.test.ts`
- Inputs: Attachment metadata acceptance criteria; JSON normalization, malformed-response, credential-redaction, OAuth header, and binary-integrity test seams.
- Output: Typed attachment metadata listing plus authenticated binary download transport that preserves exact bytes without exposing credentials.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/trello-client.test.ts`
- Expected result: New focused tests first fail because attachment methods are absent, then pass with zero/multiple/malformed metadata and exact binary download behavior covered.
- Rollback: Restore the three paths from the pre-implementation diff.

### 2. Add safe attachment result composition and filesystem downloads

- Paths: `packages/trello-work-cli/src/attachments.ts`, `packages/trello-work-cli/src/attachments.test.ts`, `packages/trello-work-cli/src/read-commands.ts`, `packages/trello-work-cli/src/read-commands.test.ts`
- Inputs: Default metadata, explicit-download, traversal, collision, external-link, partial-failure, and exact-byte acceptance criteria.
- Output: Every Work Unit result contains `attachmentCount` and attachment records; an explicit destination safely downloads uploads, records absolute paths, leaves external links metadata-only, and fails truthfully without overwrite.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/attachments.test.ts src/read-commands.test.ts`
- Expected result: Each vertical slice first fails for missing behavior and then passes; temporary-directory assertions prove destination containment and exact bytes.
- Rollback: Remove the two new files and restore the two modified files.

### 3. Expose and document the public CLI contract

- Paths: `packages/trello-work-cli/src/cli.ts`, `packages/trello-work-cli/src/cli.test.ts`, `packages/trello-work-cli/src/command-catalog.ts`, `packages/trello-work-cli/src/docs.ts`, `packages/trello-work-cli/src/docs.test.ts`, `packages/trello-work-cli/README.md`, `packages/trello-work-cli/assets/work-guide.md`, `packages/trello-work-cli/package.json`
- Inputs: `get` parser/output, visible attachment count, explicit `--attachments-dir`, default no-write, docs, and packed-boundary criteria.
- Output: `get` accepts only the additive attachment directory option, reports metadata in JSON and visible text, injects filesystem/download seams for tests, and ships synchronized help/docs plus the new production module.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/cli.test.ts src/docs.test.ts`
- Expected result: Parser/output/docs tests first fail for the missing contract and then pass; unrelated commands reject the option and normal `get` performs no writes.
- Rollback: Restore all eight modified paths.

### 4. Run implementation gates and record the handoff

- Paths: `docs/work-items/2026-07-29-fetch-trello-card-attachments/implementation-report.md`, `NEXT.md`
- Inputs: Completed TDD slices, exact changed-path audit, package/root/workflow gate outputs.
- Output: A complete implementation report with RED/GREEN and aggregate evidence; `NEXT.md` routes only to `verify-monorepo-change`.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli format && pnpm --filter @jz/ai-arsenal-trello-work-cli lint && pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck && pnpm --filter @jz/ai-arsenal-trello-work-cli test && pnpm --filter @jz/ai-arsenal-trello-work-cli validate && pnpm check && node scripts/validate-living-workflow.mjs && git diff --check`
- Expected result: Every command exits `0`; after the report and route update, the work-item validator returns `valid: true` and `nextSkill: "verify-monorepo-change"`.
- Rollback: Remove the report and restore the previous `NEXT.md` pipeline step; product rollback follows tasks 3 through 1 in reverse order.

## Affected paths

- Create: `packages/trello-work-cli/src/attachments.ts`
- Create: `packages/trello-work-cli/src/attachments.test.ts`
- Create: `docs/work-items/2026-07-29-fetch-trello-card-attachments/implementation-report.md`
- Modify: `packages/trello-work-cli/src/trello-types.ts`
- Modify: `packages/trello-work-cli/src/trello-client.ts`
- Modify: `packages/trello-work-cli/src/trello-client.test.ts`
- Modify: `packages/trello-work-cli/src/read-commands.ts`
- Modify: `packages/trello-work-cli/src/read-commands.test.ts`
- Modify: `packages/trello-work-cli/src/cli.ts`
- Modify: `packages/trello-work-cli/src/cli.test.ts`
- Modify: `packages/trello-work-cli/src/command-catalog.ts`
- Modify: `packages/trello-work-cli/src/docs.ts`
- Modify: `packages/trello-work-cli/src/docs.test.ts`
- Modify: `packages/trello-work-cli/README.md`
- Modify: `packages/trello-work-cli/assets/work-guide.md`
- Modify: `packages/trello-work-cli/package.json`
- Modify: `NEXT.md`

## Verification commands

- Focused commands from tasks 1–3 — each records expected RED followed by GREEN.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli format` — package formatting passes.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli lint` — package lint passes.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck` — strict typecheck passes.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test` — complete package suite and coverage pass.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — strict packed-artifact validation passes and includes the new module.
- `pnpm check` — root aggregate gate passes.
- `node scripts/validate-monorepo-work-item.test.mjs` — workflow suite passes.
- `node scripts/validate-living-workflow.mjs` — living workflow passes.
- `git diff --check` — whitespace check passes.
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-fetch-trello-card-attachments --json` — stage routing is valid.
- Independent staged-snapshot review — no Critical or High correctness/security/scope issue.
- After reconciliation and commit: fetch, compare full `HEAD` and `origin/master`, then verify Quality and Portability complete successfully for the exact SHA.

## Rollback

Before commit, restore modified files and remove new files from the explicit affected-path list. After commit but before dependent release activity, revert the dedicated commit. No external Trello, global-installation, or publication rollback is required because those actions are out of scope.
