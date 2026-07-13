# Maintenance Feature Selector Compatibility Verification

Date: 2026-07-13

## Verified behavior

- Every `--feature` command uses one resolver that accepts an exact slug, a plain ID, a zero-padded ID, or a matching full `ID-slug` name.
- Exact slug matching has precedence, including a numeric-only slug.
- A full selector with the right ID and wrong slug fails rather than selecting only by ID.
- `progress --json` accepts all supported forms and `sync-issues` accepts a full directory-style selector.

## Commands

| Command | Result |
| --- | --- |
| `pnpm --filter @jz/ai-arsenal-features-cli test -- --runTestsByPath src/features-state.test.ts` | Passed: 31 tests, including resolver compatibility and rejection coverage. |
| `pnpm --filter @jz/ai-arsenal-features-cli test -- --runTestsByPath src/cli.test.ts` | Passed: 11 tests, including JSON progress via slug, `1`, `001`, and `001-sample-feature`. |
| `pnpm --filter @jz/ai-arsenal-features-cli format` | Passed. |
| `pnpm --filter @jz/ai-arsenal-features-cli lint` | Passed. |
| `pnpm --filter @jz/ai-arsenal-features-cli typecheck` | Passed. |
| `pnpm --filter @jz/ai-arsenal-features-cli validate` | Passed strict publint against the packed package. |
| `pnpm --filter @jz/ai-arsenal-features-cli test` | Passed: 7 suites, 144 tests. |
