Work item: 2026-07-28-rename-trello-cli-executable
Artifact: implementation
Revision: 1
Prerequisites: contract@1,plan@2,approval@2
Status: ready

# Changed paths

- Renamed package `bin` metadata to expose only `jz-trello-flow`.
- Renamed generated help, command catalog, deprecation text, offline docs, package README, and current onboarding workbook invocations.
- Added manifest regression proving `work` is absent and updated help/docs regressions.
- Applied a minor Changeset from `0.1.0` to `0.2.0`; generated `CHANGELOG.md` records the intentional breaking executable rename.
- Updated current canonical-plan and NEXT command references.
- Added this work item's revision-two plan and digest-bound approval history.

# Tests

- Focused: 3 suites, 70 tests passed.
- Package: 19 suites, 236 passed, 2 opt-in live tests skipped.
- Package format/lint/typecheck/strict publint passed after applying Prettier to two changed source files.
- Root `pnpm check`, 30 combined workflow tests, 19 standalone work-item tests, living-workflow validation, current work-item validation, and `git diff --check` passed.
- Current package/workbook executable audit found no stale `work` command; the generated changelog intentionally names the removed executable.

# Deviations

- Plan revision 2 added `src/docs.ts`, which plan@1 omitted despite the contract requiring rendered offline docs. The user explicitly authorized routine auto-revision and approval.
- Initial formatting check found two changed TypeScript files; Prettier corrected them before all gates passed.
- The broad final old-name scan found only the intentional generated changelog migration sentence, so the current-surface audit excludes `CHANGELOG.md` while package metadata/tests explicitly prove no old binary is shipped.

# External effects

None. No publish, global reinstall, Trello access, workbook execution, or Git push occurred during implementation.
