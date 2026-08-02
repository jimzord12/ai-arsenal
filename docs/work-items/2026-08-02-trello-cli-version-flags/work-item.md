# Work Item

Work item: 2026-08-02-trello-cli-version-flags
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-08-02T16:07:40.8451521+03:00
Max time: 3 hours
Last time check: 2026-08-02T16:07:40.8451521+03:00
Turns since time check: 3
Review cycles: 4
Review status: passed
Review snapshot: sha256:ee55c2648b0843ff0c31fc22c2eb8d3d1500913245b67c9feef3eb22d6e8154c
Review batch: review-20260802-version-flags-04
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260802-version-flags-04","snapshot":"sha256:ee55c2648b0843ff0c31fc22c2eb8d3d1500913245b67c9feef3eb22d6e8154c"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260802-version-flags-04","snapshot":"sha256:ee55c2648b0843ff0c31fc22c2eb8d3d1500913245b67c9feef3eb22d6e8154c"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Make the public `jz-trello-flow` executable print its package version and exit
successfully for both top-level `-v` and `--version`, then deliver the behavior
as a versioned private package with global-shim verification.

## Non-goals

- Do not change command-specific `--if-version` optimistic-concurrency
  behavior or any existing command syntax.
- Do not require Trello credentials, configuration, network access, or a board
  selection for either version flag.
- Do not add a `version` subcommand, dependencies, package imports, registry
  publication, or unrelated parser refactors.
- Do not change any other package's behavior or mutate a Trello board.

## Acceptance criteria

- `jz-trello-flow -v` and `jz-trello-flow --version` each exit 0, write the
  same package-version value followed by a newline to stdout, and write
  nothing to stderr.
- Both flags bypass normal command parsing and credential/configuration loading
  and preserve existing `--help`, `help`, and command behavior.
- Focused executable and unit tests first demonstrate the current unsupported
  behavior, then cover both aliases and the no-configuration contract.
- The private package receives a SemVer minor version through Changesets; its
  generated changelog and package manifest are reviewed.
- Full package and repository gates, strict packed-artifact validation, and a
  clean disposable-consumer installation verify both generated command-shim
  aliases from the exact tarball.
- The exact reviewed commit is pushed, required CI passes, and the exact
  CI-green tarball replaces the Windows global pnpm installation. Independent
  generated-shim version/help and disposable or read-only smoke checks prove
  the installed artifact rather than the repository source.
- The work item records the version, tarball checksum, rollback route, commit
  and remote equality, global-install proof, smoke results, and CI URLs before
  delivery.

## Implementation summary

- Added top-level `-v` and `--version` handling before normal parsing or
  configuration loading. The executable reads its adjacent packed
  `package.json`, so its output stays aligned with the released package.
- Added executable and direct-command regression coverage for both aliases,
  including credential-free stdout/stderr behavior.
- Applied the required Changeset, producing private package version `0.6.0`
  and its generated changelog entry.
- The focused version test first failed with both flags reported as unknown
  commands. After the implementation it passed, as did the complete
  `src/cli.test.ts` suite (64 tests), Prettier, targeted ESLint, and package
  typechecking.

## Review findings and repairs

The initial review batch passed with no required findings. Delivery
reconciliation updated the canonical-plan candidate, so review evidence was
reset for a fresh final-snapshot batch. Both reviewers failed batch
`review-20260802-version-flags-02` with the same Medium finding: the canonical
plan's opening operator state still named the already delivered legacy-junction
work as current. The repair updated only that stale canonical status. Both
reviewers passed repaired batch `review-20260802-version-flags-03` with no
remaining required findings. Exact-artifact global-install reconciliation then
updated the canonical plan, so review evidence was reset for the closure
candidate. Both reviewers passed closure batch
`review-20260802-version-flags-04` with no required findings.

## Final verification

Result: passed

- `pnpm --dir packages/trello-work-cli run format`, `run lint`, `run
typecheck`, `test`, and `run validate` each exited 0. The package suite
  passed 285 tests with 2 gated live cases skipped; strict publint passed.
- `pnpm check` exited 0 across the repository. `node
scripts/validate-living-workflow.mjs`, `node
scripts/validate-monorepo-work-item.mjs --work-item
2026-08-02-trello-cli-version-flags --json`, and `git diff --check` each
  exited 0.
- A fresh `pnpm pack` produced
  `jz-ai-arsenal-trello-work-cli-0.6.0.tgz` with SHA-256
  `c842e57ad900c717b572d6f117b99c8bb49f7b1faa00841995ff8b96232329b4`.
  A clean unrelated pnpm consumer installed that tarball and its generated
  Windows shim returned `0.6.0` with exit 0 and no stderr for both `-v` and
  `--version`; `--help` also exited 0 with nonempty output. An initial ad hoc
  helper returned nonzero only because it expected the unsupported heading
  `Usage: jz-trello-flow`; the observed help heading is
  `jz-trello-flow commands:` and the follow-up contract check passed.
- After the delivery-only canonical-plan repair, `pnpm exec prettier --check
NEXT.md docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md
docs/work-items/2026-08-02-trello-cli-version-flags/work-item.md`, both
  workflow validators, and `git diff --check` each exited 0.

## Delivery evidence

- Artifact commit and matching remote SHA:
  `343e240cf3232600ad2704c400d585bd09146796`.
- CI passed: [Quality 30750430697](https://github.com/jimzord12/ai-arsenal/actions/runs/30750430697)
  and [Portability 30750430747](https://github.com/jimzord12/ai-arsenal/actions/runs/30750430747).
- Exact `0.6.0` tarball: `jz-ai-arsenal-trello-work-cli-0.6.0.tgz`, SHA-256
  `c842e57ad900c717b572d6f117b99c8bb49f7b1faa00841995ff8b96232329b4`.
- Global replacement used `pnpm add -g <exact 0.6.0 tarball>` after confirming
  the prior global `0.5.1` package. The installed package is
  `@jz/ai-arsenal-trello-work-cli@0.6.0`; its generated Windows shim returned
  `0.6.0` with exit 0 for both aliases, and its help plus `docs --list` smoke
  checks passed from outside the repository. Installed and source `src/cli.ts`
  SHA-256 values match: `24b1905080836d820ed4874d7f496e50fde84845a89a3ea78934523b3ec7abfb`.
- Rollback artifact: the documented exact `0.5.1` tarball from commit
  `f4d756cd634898804850cfc20596b7f145ef7515`, SHA-256
  `ee8671d777865cf1d9ff8de1d21c84d8e08dff70ca49602b0a172b4d90ebee66`;
  restore with `pnpm add -g <that verified tarball>`.
