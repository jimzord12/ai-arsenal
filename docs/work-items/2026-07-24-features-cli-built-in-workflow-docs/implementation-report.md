Work item: 2026-07-24-features-cli-built-in-workflow-docs
Artifact: implementation
Revision: 1
Prerequisites: contract@1,plan@1,approval@1
Status: ready

# Changed paths

- `packages/features-cli/src/workflow-docs.ts`
- `packages/features-cli/src/workflow-docs.test.ts`
- `packages/features-cli/src/workflow-docs.current.test.ts`
- `packages/features-cli/src/cli.ts`
- `packages/features-cli/src/cli.test.ts`
- `packages/features-cli/test/characterization.test.ts`
- `packages/features-cli/test/fixtures/help.txt`
- `packages/features-cli/test/e2e.test.ts`
- `packages/features-cli/package.json`
- `packages/features-cli/README.md`
- `packages/jz-skills/jz-resume-feature/SKILL.md`

## Decisions

- Added one typed, offline `workflow-docs.ts` model that owns the command catalog, help text, nine canonical topics, exact/numeric topic lookup, static renderers, current-state guidance, and structured docs errors.
- Kept direct CLI dispatch and the existing `progress --json` object unchanged. `docs current` resolves through the existing selector/progress functions and embeds that unchanged progress object with guidance.
- Added exhaustive `Record<FrontierKind, ...>` guidance, including explicit no-owner stops for migration, blocked work, feature review, and archived features.
- Kept `--docs` unsupported, added no dependency, performed no release/distribution installation outside isolated tests, and changed the package allowlist from 10 to 11 files.
- Updated `jz-resume-feature` to consume `docs current --json` instead of maintaining a duplicate frontier-to-skill table.

## Tests

- Red then green: static docs registry/parser/help/topic tests; focused suite passed with 27 tests.
- Red then green: docs-current no-current, explicit paused selection, and JSON selection-error tests; focused suite passed with 30 tests.
- `pnpm --filter @jz/ai-arsenal-features-cli exec jest test/e2e.test.ts --runInBand` — passed with 15 real-process tests after required subprocess permission, including Unicode/read-only docs and clean packed-consumer docs invocation.
- `pnpm --filter @jz/ai-arsenal-features-cli lint` — passed.
- `pnpm --filter @jz/ai-arsenal-features-cli typecheck` — passed.
- Targeted Prettier check for changed source/documentation paths — passed.
- `pnpm --filter @jz/ai-arsenal-features-cli pack --dry-run --json` — passed; exact 11 files including `src/workflow-docs.ts`.
- `pnpm --filter @jz/ai-arsenal-features-cli validate` — strict publint passed after required subprocess permission.
- `pnpm --filter @jz/ai-arsenal-features-cli test` — passed: 9 suites, 154 tests.
- `pnpm check` — passed.
- `pnpm validate:workflow` — passed while implementation was active.
- `git diff --check` — passed.

## Deviations

None.
