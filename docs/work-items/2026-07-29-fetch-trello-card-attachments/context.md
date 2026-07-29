Work item: 2026-07-29-fetch-trello-card-attachments
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `.agents/skills/orchestrate-monorepo-work/SKILL.md`
- `.agents/skills/capture-monorepo-change/SKILL.md`
- `.agents/skills/orient-monorepo-change/SKILL.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`

## Repository snapshot

- Branch `master`; clean baseline `4671aee619c9d256de7299a0bbbc2ddc77571c66`, aligned with fetched `origin/master` before capture.
- `@jz/ai-arsenal-trello-work-cli@0.2.0` exposes `jz-trello-flow`.
- Existing package gates: format, lint, strict typecheck, Jest with coverage, and strict publint; root `pnpm check` and workflow validators are available.
- The user authorized production-pragmatic implementation, routine commit/push, CI, and testing.

## Relevant files

- `packages/trello-work-cli/src/read-commands.ts`: `getWorkUnit` currently resolves and normalizes only the card.
- `packages/trello-work-cli/src/trello-client.ts`: JSON/text request helper, card normalization, and card API methods; no attachment methods or binary response path.
- `packages/trello-work-cli/src/trello-types.ts`: no attachment or binary transport types.
- `packages/trello-work-cli/src/cli.ts`: `get` accepts only configured common options; CLI dependencies support text file reads but no filesystem-writing injection.
- `packages/trello-work-cli/src/read-commands.test.ts`, `trello-client.test.ts`, and `cli.test.ts`: focused seams for metadata, transport, parsing, output, and command routing.
- `packages/trello-work-cli/src/docs.ts`, `command-catalog.ts`, package README, and shipped work guide: user-visible command contract.
- Live evidence: card `6a691ff583597d8cfdd0c780` has one uploaded Markdown attachment, 15,182 bytes.

## Risks

- Existing transport coerces every response to text and JSON; file downloads need a separate binary-safe path.
- Trello uploaded-file download authentication uses an OAuth `Authorization` header; credentials must never appear in output or persisted evidence.
- User-controlled filenames require basename sanitization and traversal prevention.
- Duplicate filenames must not silently overwrite each other; deterministic attachment-ID disambiguation is preferable.
- A partial multi-file download must fail clearly and retain truthful output without claiming all files succeeded.
- Default `get` must remain free of local filesystem writes.

## Open questions

None. The user accepted default attachment metadata plus explicit `--attachments-dir` downloading at production-pragmatic depth.
