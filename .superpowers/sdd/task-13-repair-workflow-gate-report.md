# Task 13 — Repair Workflow Gate

## Scope

- Restored the root `test:workflow` gate so it runs both workflow validator test files.
- Required each workflow `SKILL.md` frontmatter `name` to exactly match its required skill directory name.

## Test-first evidence

- Added a root-script assertion and a disposable fixture with a mismatched frontmatter name.
- Confirmed both tests failed before the gate changes, then passed after the minimal implementation.

## Verification

- `node --test scripts/validate-living-workflow.test.mjs` — 7 passing.
- `pnpm test:workflow` — 19 passing.
- `pnpm validate:workflow` — passed.
- Focused Prettier check and `git diff --check` — passed.
