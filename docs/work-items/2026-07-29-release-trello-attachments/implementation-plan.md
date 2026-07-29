Work item: 2026-07-29-release-trello-attachments
Artifact: plan
Revision: 1
Prerequisites: contract@1
Status: ready

# Preconditions

- Baseline remains clean and aligned at `1c1e7e438b6c75fd28e406e67796c0266baea7c0`.
- Contract revision 1 is ready.
- User authorization explicitly covers versioning, exact CI-green global installation, commit, and push.

# Implementation sequence

1. Create one minor Changeset for `@jz/ai-arsenal-trello-work-cli` describing default attachment metadata and explicit safe downloads.
2. Run `pnpm changeset status --output <temporary-json>` and verify only that package is selected for `minor`.
3. Run `pnpm changeset version`; verify the Changeset is consumed, source version becomes `0.3.0`, changelog describes the feature, lockfile scope is limited, and unrelated package versions are unchanged.
4. Update package/current docs only where generated/current release truth requires `0.3.0`.
5. Run:
   - package format/lint/typecheck/test/strict validate,
   - focused docs/version/attachment/CLI tests,
   - `pnpm check`, workflow validators, and `git diff --check`.
6. Write `implementation-report.md`, route to verification, and obtain fresh independent read-only review of exact diff, SemVer/changelog/packed boundary, and absence of publication/install/Trello mutation.
7. Write passed verification only from observed evidence; reconcile canonical plan and `NEXT.md`, close the work item, rerun validators, commit, and push.
8. Fetch and prove full `HEAD == origin/master`; watch Quality and Portability for the exact SHA.
9. From the clean exact CI-green checkout, pack `@jz/ai-arsenal-trello-work-cli` into a disposable directory, record tarball SHA-256, inspect the packed manifest/files, and verify `0.3.0`, sole `jz-trello-flow` executable, attachment module/docs present, tests excluded, and obsolete `work` alias absent.
10. Replace the global package with the exact tarball using native Windows pnpm execution. Verify global package/version and native `jz-trello-flow --help` attachment option.
11. Run the read-only TestingBoard/card attachment workbook in a disposable local directory: metadata-only no-write, downloaded path/bytes/hash/readability, and repeat-download no-overwrite. Do not mutate Trello.
12. Directly reconcile the Markdown-only post-CI/install/live evidence, commit/push that evidence update, require final Quality and Portability for the documentation SHA, and finish clean/aligned.

# Affected paths

- `.changeset/<generated-release-name>.md` (created then consumed by Changesets)
- `packages/trello-work-cli/package.json`
- `packages/trello-work-cli/CHANGELOG.md`
- `pnpm-lock.yaml`
- `packages/trello-work-cli/README.md` only if current version instructions require it
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/work-items/2026-07-29-release-trello-attachments/*.md`

No product implementation source is expected to change.

# External effects

- Git commit/push and CI are required release evidence.
- Global package replacement is authorized only after exact-SHA CI.
- TestingBoard access is read-only and restricted to the approved board/card.
- Registry publication and Trello mutation are prohibited.

# Rollback

- Before commit: restore generated release metadata and work-item diff.
- After push but before install: leave the valid private release in Git and keep global `0.2.0`.
- After failed installation/live validation: reinstall exact `0.2.0`, preserve all evidence, and report failure without publication or Trello mutation.

# Done

All contract acceptance criteria pass, current truth records exact Git/CI/tarball/install/live evidence, final documentation SHA is CI-green, and the repository is clean/aligned.
