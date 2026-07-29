Work item: 2026-07-29-fetch-trello-card-attachments
Artifact: implementation
Revision: 1
Prerequisites: contract@1,plan@1,approval@1
Status: ready

# Changed paths

- `NEXT.md`
- `docs/work-items/2026-07-29-fetch-trello-card-attachments/implementation-report.md`
- `packages/trello-work-cli/README.md`
- `packages/trello-work-cli/assets/work-guide.md`
- `packages/trello-work-cli/package.json`
- `packages/trello-work-cli/src/attachments.test.ts`
- `packages/trello-work-cli/src/attachments.ts`
- `packages/trello-work-cli/src/cli.test.ts`
- `packages/trello-work-cli/src/cli.ts`
- `packages/trello-work-cli/src/command-catalog.ts`
- `packages/trello-work-cli/src/docs.test.ts`
- `packages/trello-work-cli/src/docs.ts`
- `packages/trello-work-cli/src/read-commands.test.ts`
- `packages/trello-work-cli/src/read-commands.ts`
- `packages/trello-work-cli/src/trello-client.test.ts`
- `packages/trello-work-cli/src/trello-client.ts`
- `packages/trello-work-cli/src/trello-types.ts`

## Decisions

- Every successful `get` lists complete normalized attachment metadata in Trello order. The default path only describes attachments and performs no attachment download or local filesystem write.
- Uploaded-file transport uses an OAuth authorization header only for approved Trello HTTPS URLs and preserves the exact binary response. Attachment metadata rejects credential-bearing URLs, and normal output continues through the existing credential-redaction boundary.
- Explicit downloads preflight safe basenames and all destination collisions before network work, stay inside the resolved destination, disambiguate duplicate names with safe attachment IDs, never overwrite, skip external links, and retain truthful completed-path recovery data after partial failure.
- Text output keeps one parseable JSON metadata record per physical `Attachment:` line so embedded attachment-name newlines cannot forge extra output records. JSON output exposes the same complete structured result.
- The offline catalog, built-in docs, README, shipped guide, and package allowlist describe and ship the additive `get --attachments-dir <directory>` contract.

## Tests

- Prior strict RED evidence preserved in the tests and preceding implementation transcript:
  - Attachment metadata was absent from the typed Trello response boundary and `get` result.
  - `listCardAttachments` was absent before the metadata-listing client test.
  - `downloadAttachment` was absent before the authenticated binary transport test.
  - The attachment helpers/module were absent before the safe filesystem test seam.
- Current-session strict RED evidence:
  - `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/cli.test.ts src/docs.test.ts` failed because the `get` catalog options did not contain `--attachments-dir`; after the catalog/docs implementation, the docs test passed.
  - The same focused command then failed because the real packed artifact did not contain `package/src/attachments.ts`; adding only `src/attachments.ts` to the manifest allowlist made the packed-boundary assertion pass while `attachments.test.ts` remained excluded.
- Detailed observed vertical-slice RED outcomes:
  - `src/trello-client.test.ts`: `TypeError: api.listCardAttachments is not a function`, followed by metadata GREEN; then `TypeError: client(...).downloadAttachment is not a function`, followed by authenticated binary GREEN.
  - `src/attachments.test.ts src/read-commands.test.ts`: missing `./attachments` module; traversal resolved outside the destination; duplicate names resolved to the same file; an existing file was overwritten; a raw partial-download error escaped; default `get` omitted attachment fields; and explicit-directory results remained not downloaded. Each failure was followed by the smallest implementation and a GREEN focused rerun before the next slice.
  - `src/cli.test.ts src/docs.test.ts`: `--attachments-dir` was rejected on `get`; text lacked the explicit count and one-line records; the catalog lacked the option; and the packed artifact lacked `src/attachments.ts`. Each failed before its parser/output/docs/package implementation and passed afterward.
  - `src/trello-client.test.ts`: a non-Trello URL reached transport and returned `TRELLO_NETWORK_ERROR`, while a credential-bearing metadata URL was accepted. HTTPS Trello-host and credential-bearing-URL guards then produced 11/11 GREEN with zero unsafe transport calls.
- Focused GREEN:
  - `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/trello-client.test.ts` — 1 suite, 11 tests passed.
  - `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/attachments.test.ts src/read-commands.test.ts` — 2 suites, 18 tests passed.
  - `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/cli.test.ts src/docs.test.ts` — 2 suites, 63 tests passed.
- Implementation-gate corrections:
  - The first package format check reported the new attachment files and `trello-client.test.ts`; repository Prettier was applied only to approved affected paths.
  - The first lint check rejected a control-character regular expression in `attachments.ts`; the same unsafe-character rule was expressed as an explicit character-code check, after which the focused seam, lint, typecheck, and format checks passed.
  - The changed-path audit found and removed a duplicate `src/attachments.ts` manifest allowlist entry before the final gate run.
- Final package gates:
  - `pnpm --filter @jz/ai-arsenal-trello-work-cli format` — passed.
  - `pnpm --filter @jz/ai-arsenal-trello-work-cli lint` — passed.
  - `pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck` — passed.
  - `pnpm --filter @jz/ai-arsenal-trello-work-cli test` — 20 suites passed; 251 tests passed and 2 opt-in live tests skipped; coverage passed.
  - `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — strict publint packed-artifact validation passed.
- Final aggregate and workflow gates:
  - `pnpm check` — passed, including formatting, all workspace lint/typecheck/tests, 30 workflow tests, living-workflow validation, and current work-item validation.
  - `node scripts/validate-monorepo-work-item.test.mjs` — 19 tests passed.
  - `node scripts/validate-living-workflow.mjs` — passed.
  - `git diff --check` — passed.
  - Pre-report `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-fetch-trello-card-attachments --json` — `valid: true`, `nextSkill: "implement-monorepo-change"`.
  - Post-report and route-update invocation of the same validator — `valid: true`, `nextSkill: "verify-monorepo-change"`, with implementation revision 1 ready.

## Deviations

None.
