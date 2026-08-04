# Work Item

Work item: 2026-08-04-add-trello-command-help
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-08-04T16:31:59+03:00
Max time: 4 hours
Last time check: 2026-08-04T17:08:22+03:00
Turns since time check: 1
Review cycles: 4
Review status: passed
Review snapshot: sha256:4296c67a51d693a1c84c9e765d4c4c8a9efa5ae8da738338ce62230060aea3b0
Review batch: review-20260804-command-help-04
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260804-command-help-04","snapshot":"sha256:4296c67a51d693a1c84c9e765d4c4c8a9efa5ae8da738338ce62230060aea3b0"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260804-command-help-04","snapshot":"sha256:4296c67a51d693a1c84c9e765d4c4c8a9efa5ae8da738338ce62230060aea3b0"}]
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
- `scripts/validate-monorepo-work-item.mjs` and `.test.mjs` — normalize npm scoped package names to pnpm's actual tarball filename by omitting only the leading `@`.

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
- Scoped-tarball regression first failed with `Delivery evidence tarball identity or checksum is invalid`; `node --test scripts/validate-monorepo-work-item.test.mjs` then passed all 69 tests.

## Review findings and repairs

Cycle 1 (`review-20260804-command-help-01`, `sha256:43c66c3091ddb3338ad8465a298bdbc8520f287a082940e1afb4797437882f1d`) reconciled as failed: contract passed; quality found two High findings.

- Quality reported a possible configured-option omission. Inspection of the final catalog transform and real `draft create`, `design start`, and `checklist item set` help output showed it already appends `--hermes-env` and `--board`; exhaustive catalog tests now bind rendered options and configured examples to that contract.
- Reusing raw synopsis alternatives (`|`, `--checked|--unchecked`) did produce non-executable mutation examples that could place `--dry-run` after a shell pipeline.

Repair completed: each catalog entry now owns one pipe-free example; mutations include `--dry-run`, configured examples include `--board <id-or-exact-name>`, and focused tests enforce both properties.

Cycle 2 (`review-20260804-command-help-02`, `sha256:ac6a171743e07a93a78981c15f83bf7fde3d05c07347beb7e64fb7648a307a32`) reconciled as passed: contract and quality reviewers confirmed the repaired explicit examples, complete final options, early offline dispatch, and full catalog coverage. No required finding remains.

Release metadata is part of the reviewed CLI delivery snapshot. The new minor Changeset and generated package version/changelog require a fresh review and final verification before commit, CI, packing, or global replacement.

Cycle 3 (`review-20260804-command-help-03`, `sha256:19db008344c489a9599dfd712fb5fbd95cc01069616e9e6673a14d55b5e31c49`) reconciled as passed: contract and quality reviewers confirmed the private `0.7.0` SemVer-minor release metadata, changelog, package boundary, and unchanged command-help contract. No required finding remains.

Cycle 4 (`review-20260804-command-help-04`, `sha256:4296c67a51d693a1c84c9e765d4c4c8a9efa5ae8da738338ce62230060aea3b0`) reconciled as passed: contract and quality reviewers confirmed exact pnpm scoped-package filename normalization, retained strict evidence checks, and the scoped fixture regression. No required finding remains.

Cycle 4 repaired the delivery-evidence validator so actual pnpm scoped-package tarballs omit the leading `@` before scope separators become hyphens. The exact `0.7.0` artifact, CI, global replacement, shim smoke, provenance, and rollback evidence remain complete.

## Final verification

Result: passed

- Changed-file observation — delivery-evidence validator, its scoped-package fixture, active work-item record, `NEXT.md`, and canonical plan; all are within the repair scope. Result: passed.
- `pnpm exec prettier --check NEXT.md docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md docs/work-items/2026-08-04-add-trello-command-help/work-item.md scripts/validate-monorepo-work-item.mjs scripts/validate-monorepo-work-item.test.mjs` — exit 0.
- `pnpm lint:root` — exit 0.
- `pnpm test:workflow` — exit 0; 127 passed and 2 platform-conditional skips, including the 69-test `validate-monorepo-work-item` suite.
- `git diff --check` — exit 0.
- `node scripts/validate-living-workflow.mjs` — exit 0; passed.
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-08-04-add-trello-command-help --json` — exit 0; fresh fourth review batch and verify route passed.

## Delivery evidence

Delivery result: passed
Artifact-bearing commit: 6f59cb1f5246e5eec1d5fe3e4fbf96d5c620b13d
Remote ref equality: {"ref":"refs/heads/work/2026-08-04-add-trello-command-help","sha":"6f59cb1f5246e5eec1d5fe3e4fbf96d5c620b13d","confirmed":true}
Required CI: [{"url":"https://github.com/jimzord12/ai-arsenal/actions/runs/30916419572","sha":"6f59cb1f5246e5eec1d5fe3e4fbf96d5c620b13d","conclusion":"success"},{"url":"https://github.com/jimzord12/ai-arsenal/actions/runs/30916418727","sha":"6f59cb1f5246e5eec1d5fe3e4fbf96d5c620b13d","conclusion":"success"}]
Package: {"name":"@jz/ai-arsenal-trello-work-cli","version":"0.7.0"}
Tarball: {"file":"jz-ai-arsenal-trello-work-cli-0.7.0.tgz","sha256":"bb8d22da2e8202c034823597aa4c5577dfe36b61cd2021074ca540a0daf10891","pack":"success"}
Global replacement: {"command":"pnpm add --global <exact-0.7.0-tarball> && pnpm --dir C:/Users/jimzord12/Documents/GitHub/ai-arsenal run repair:global-trello-shim","result":"success","installedPackage":"@jz/ai-arsenal-trello-work-cli","installedVersion":"0.7.0"}
Installed-shim smoke: {"version":"passed","help":"passed","featureSmoke":"passed"}
Installed artifact provenance: {"artifactBytes":"confirmed","sourceTree":"not-used","srcCliSha256":"15718b7bed0ab51fbf9f942efb180614791ba5363661c7b5102de90054f39713"}
Rollback: {"identity":"jz-ai-arsenal-trello-work-cli-0.6.0.tgz sha256:c842e57ad900c717b572d6f117b99c8bb49f7b1faa00841995ff8b96232329b4","ready":true,"attempted":false,"result":"not-attempted"}
Clean worktree: {"confirmed":true}
