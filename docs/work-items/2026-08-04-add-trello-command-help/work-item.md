# Work Item

Work item: 2026-08-04-add-trello-command-help
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-08-04T16:31:59+03:00
Max time: 4 hours
Last time check: 2026-08-04T16:50:12+03:00
Turns since time check: 2
Review cycles: 3
Review status: passed
Review snapshot: sha256:19db008344c489a9599dfd712fb5fbd95cc01069616e9e6673a14d55b5e31c49
Review batch: review-20260804-command-help-03
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260804-command-help-03","snapshot":"sha256:19db008344c489a9599dfd712fb5fbd95cc01069616e9e6673a14d55b5e31c49"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260804-command-help-03","snapshot":"sha256:19db008344c489a9599dfd712fb5fbd95cc01069616e9e6673a14d55b5e31c49"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none
CLI local-delivery evidence: required

## Goal

Make every public `jz-trello-flow` command and subcommand provide concise, version-matched conventional `--help` output that identifies its required positional arguments, options, and one safe example.

## Non-goals

- Implement the other Issue #21 authoring/discovery improvements or any child issue other than #22.
- Replace Issue #6's offline documentation lookup convention, topic taxonomy, or recovery behavior; command-specific help may link to the existing docs route but must not depend on an Issue #6 implementation.
- Relax explicit-board selection, credential handling, validation, dry-run, version-guard, operation-ID, read-back, or Trello lifecycle safeguards.
- Publish to a registry, merge or delete work branches, or make live Trello mutations outside existing test boundaries.

## Acceptance criteria

- `jz-trello-flow draft create --help` exits successfully and documents its options.
- Nested commands including `jz-trello-flow design start --help` and `jz-trello-flow checklist item set --help` exit successfully and document their syntax/options.
- Every public command and subcommand accepts conventional per-command `--help`; each output is concise, version-matched, and includes required positional arguments, options, and one safe example.
- Focused offline and real-process tests cover representative top-level, nested, and deeply nested help paths plus parser preservation for non-help invocations.
- The private Trello CLI release uses an appropriate SemVer bump through Changesets; the exact packed artifact passes package and repository gates, installs in a clean disposable consumer, and is globally replaced only from the exact pushed CI-green artifact-bearing commit with preflight, rollback, installed-artifact provenance, cross-shell shim repair/smoke, and durable delivery evidence.

## Implementation summary

Implemented catalog-backed per-command `--help` before parser validation or configuration loading.

### Changed paths

- `packages/trello-work-cli/src/command-catalog.ts` — make each catalog entry carry one explicit, executable safe example; retain final configured-option and board augmentation in the same catalog transform.
- `packages/trello-work-cli/src/docs.ts` — resolve public command-path prefixes from the existing catalog and render concise syntax, summary, options, and the catalog-owned example.
- `packages/trello-work-cli/src/cli.ts` — route `--help` after a public command path to the offline renderer before argument validation, credentials, configuration, or mutation.
- `packages/trello-work-cli/src/cli.test.ts` — exercise every catalog entry offline, process-level `draft create`, `design start`, and `checklist item set` paths, complete configured options, and pipe-free dry-run examples.
- `packages/trello-work-cli/package.json` and `CHANGELOG.md` — Changesets generated the SemVer-minor private `0.7.0` release and changelog entry for per-command help.

### Decisions

- Reused the version-matched `COMMAND_CATALOG` as the single command, option, and example authority; `validate --help` intentionally renders both supported validate forms.
- Mutation examples are explicit single invocations with `--dry-run`; configured commands append `--board <id-or-exact-name>` after their concrete example rather than deriving an example from synopsis notation.

### Focused checks

- New help tests first failed with `USAGE_ERROR: Unknown option for <command>: --help.`
- Repair tests first failed because raw synopsis alternatives rendered examples containing `|` and `--checked|--unchecked`.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest --runInBand --coverage=false --runTestsByPath src/cli.test.ts` — passed, 96 tests.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli run typecheck` — passed.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli run lint` — passed.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli run format` — passed.

## Review findings and repairs

Cycle 1 (`review-20260804-command-help-01`, `sha256:43c66c3091ddb3338ad8465a298bdbc8520f287a082940e1afb4797437882f1d`) reconciled as failed: contract passed; quality found two High findings.

- Quality reported a possible configured-option omission. Inspection of the final catalog transform and real `draft create`, `design start`, and `checklist item set` help output showed it already appends `--hermes-env` and `--board`; exhaustive catalog tests now bind rendered options and configured examples to that contract.
- Reusing raw synopsis alternatives (`|`, `--checked|--unchecked`) did produce non-executable mutation examples that could place `--dry-run` after a shell pipeline.

Repair completed: each catalog entry now owns one pipe-free example; mutations include `--dry-run`, configured examples include `--board <id-or-exact-name>`, and focused tests enforce both properties.

Cycle 2 (`review-20260804-command-help-02`, `sha256:ac6a171743e07a93a78981c15f83bf7fde3d05c07347beb7e64fb7648a307a32`) reconciled as passed: contract and quality reviewers confirmed the repaired explicit examples, complete final options, early offline dispatch, and full catalog coverage. No required finding remains.

Release metadata is part of the reviewed CLI delivery snapshot. The new minor Changeset and generated package version/changelog require a fresh review and final verification before commit, CI, packing, or global replacement.

Cycle 3 (`review-20260804-command-help-03`, `sha256:19db008344c489a9599dfd712fb5fbd95cc01069616e9e6673a14d55b5e31c49`) reconciled as passed: contract and quality reviewers confirmed the private `0.7.0` SemVer-minor release metadata, changelog, package boundary, and unchanged command-help contract. No required finding remains.

## Final verification

Result: passed

- Changed-file observation — `NEXT.md`, the active work-item record, package `0.7.0` metadata/changelog, and the four in-scope implementation paths; all are within the recorded scope. Result: passed.
- `pnpm check` — exit 0. Prettier, all package lint/typecheck/test gates, 154 Features CLI tests, 317 Trello Flow tests with 2 credential-gated skips, 79 weekly-report tests, 127 workflow tests with 2 platform-conditional skips, and both workflow validators passed.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli run validate` — exit 0; strict `publint --pack pnpm` passed for private `0.7.0`.
- `git diff --check` — exit 0.
- `node scripts/validate-living-workflow.mjs` — exit 0; passed.
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-08-04-add-trello-command-help --json` — exit 0; the `0.7.0` reviewed snapshot and `verify-monorepo-change` route were valid.
- `bun packages/trello-work-cli/src/bin.ts draft create --help`, `design start --help`, and `checklist item set --help` — each exit 0; output contained command syntax, final options, and one pipe-free `--dry-run` example with the required board selector.
