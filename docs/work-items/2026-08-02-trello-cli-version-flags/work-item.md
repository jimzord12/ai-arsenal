# Work Item

Work item: 2026-08-02-trello-cli-version-flags
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-08-02T16:07:40.8451521+03:00
Max time: 3 hours
Last time check: 2026-08-02T16:07:40.8451521+03:00
Turns since time check: 3
Review cycles: 2
Review status: passed
Review snapshot: sha256:f98aeb79989cbbe83b161f96fc48ca3ac7e19db6007c379cad3209d4d9d0b223
Review batch: review-20260802-version-flags-03
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260802-version-flags-03","snapshot":"sha256:f98aeb79989cbbe83b161f96fc48ca3ac7e19db6007c379cad3209d4d9d0b223"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260802-version-flags-03","snapshot":"sha256:f98aeb79989cbbe83b161f96fc48ca3ac7e19db6007c379cad3209d4d9d0b223"}]
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
remaining required findings.

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
