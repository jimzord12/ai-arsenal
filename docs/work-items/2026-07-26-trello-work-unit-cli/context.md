Work item: 2026-07-26-trello-work-unit-cli
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`, especially sections 4, 7, and 8
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `.agents/skills/orient-monorepo-change/SKILL.md`
- No nearer `AGENTS.md` currently applies because the new package directory does not exist.

## Repository snapshot

- Repository: `C:\Users\jimzord12\Documents\GitHub\ai-arsenal`
- Branch: `master`
- Commit: `d351906e86128776af6e097c09b96b6e65c3d3cb`
- Initial status before capture: clean; current changes are the active work item's `request.md` and `NEXT.md` registration.
- Workspace: pnpm package discovery through `packages/*`; Turborepo defines `format`, `lint`, `typecheck`, `test`, `pack`, and `validate` tasks.
- Root tooling: Node 24, pnpm 11, TypeScript 6, Jest 29, ESLint, Prettier, publint.
- Existing package convention: scoped names beginning `@jz/ai-arsenal-`; package-local strict TypeScript/Jest scripts participate in root Turbo commands.

## Relevant files

- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `turbo.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `prettier.config.mjs`
- `packages/features-cli/package.json`
- `packages/features-cli/tsconfig.json`
- `packages/features-cli/jest.config.cjs`
- `packages/features-cli/jest-transformer.cjs`
- `C:\Users\jimzord12\AppData\Local\hermes\cache\skill-build\trello-work-unit-planner\assets\work-unit-metadata.schema.json`
- `C:\Users\jimzord12\AppData\Local\hermes\cache\skill-build\trello-work-unit-planner\assets\work-unit-template.md`
- `C:\Users\jimzord12\AppData\Local\hermes\cache\skill-build\trello-work-unit-planner\scripts\validate.py`
- Installed skill counterparts under `C:\Users\jimzord12\AppData\Local\hermes\skills\productivity\trello-work-unit-planner\`.

## Risks

- The installed planner contract conflicts with the fuller staged V1.1 package on serialization and relationship identifiers; the CLI must not encode both variants.
- Trello board/list identifiers and credentials are unavailable, so no live API mutation or read-back verification can be exercised now.
- Trello does not provide a demonstrated compare-and-swap primitive for a board counter in the inspected evidence. A production allocator must not claim concurrency safety until its backing mechanism is selected and verified.
- Generic metadata updates must not be able to mutate `status` or system-managed identifiers/timestamps.
- Partial creation failures must preserve enough idempotency/recovery evidence to avoid duplicate cards.
- A new executable and metadata contract are public behavior and persisted-format boundaries; the implementation plan requires explicit user approval before product changes.

## Open questions

- Trello board ID, Inbox list ID, and credential/configuration source will be supplied by the user later.
- The live atomic sequence backend remains deferred. Offline code can define and test an allocator contract and creation idempotency model, but must not present a Trello-only counter as concurrency-safe without evidence.
