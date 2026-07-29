Work item: 2026-07-29-jz-trello-flow-skills-install
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Goal

Deliver one offline `jz-trello-flow skills install` vertical slice that, from the actual packed package in a disposable consumer, deterministically selects the target repository and safely installs the running CLI's four canonical managed Trello skills while preserving unrelated skills.

## Non-goals

- Reconciliation, commit, push, publication, registry release, version bump, Changeset, changelog generation, or global installation.
- Any Trello credential loading, Trello API access, production-board mutation, Work Unit lifecycle mutation, or live test invocation.
- Installing skills other than the four canonical `trello-work-*` skills.
- Generating client-specific adapters, changing lifecycle semantics, changing the four repository-owned canonical sources, or creating a second canonical copy maintained by hand.
- Merge-based skill updates, per-skill version migration, user-edit preservation inside managed skill directories, or modification/removal of unrelated `.agents/skills/` entries.
- Dangerous deletion, source deletion, Git history mutation, or consumer `.scratch` inspection/mutation.

## Hard walls

- Treat the change as Tier 2.
- Preserve the intentional pre-existing `NEXT.md` modification and incorporate its locked decisions into the work-item artifacts without overwriting them.
- Follow strict vertical-slice TDD with observed RED and GREEN evidence.
- The public command is `jz-trello-flow skills install`.
- Detect the target repository root deterministically and report clear errors.
- Every invocation explicitly replaces only the four managed `trello-work-*` directories from assets bundled with the running CLI.
- Preserve unrelated skills.
- Retain `--dry-run` and report installed or replaced targets.
- Prepare and validate the complete payload with the official pinned `skills-ref` validator before any replacement.
- A preparation failure must leave existing targets unchanged.
- Essential acceptance includes packing the actual pnpm tarball, installing it in a disposable consumer, and invoking the command there.
- Use exact repository scripts and validators; do not guess substitutions.
- Run all required implementation and verification gates and keep workflow artifacts truthful.
- Do not reconcile, commit, push, publish, globally install, or invoke Trello.
- Leave any independent review required by verification explicitly to the supervising agent rather than self-certifying.
- Public command: `jz-trello-flow skills install`.
- Install into the target repository's `.agents/skills/` directory.
- Every run replaces the four CLI-managed `trello-work-*` skill directories with the versions bundled in the running CLI; no merge or version-migration logic.
- Never modify unrelated skill directories.
- Mark installed files as managed and replaceable by the CLI.
- Prepare and validate the complete skill set before replacing targets so failed preparation cannot leave a partial installation.
- Support `--dry-run` and report installed/replaced targets.
- Include real packed-artifact coverage proving the skills ship and can be installed from the package.

## Acceptance criteria

1. `jz-trello-flow skills install` is present in parser routing, short help, the shared command catalog, package README, and the packaged offline guide; it runs without Trello configuration or credentials.
2. Starting from a nested working directory inside a valid repository, the command chooses the same repository root deterministically and installs only beneath that root's `.agents/skills/`; invocation with no valid repository root exits nonzero with a stable, clear error and makes no filesystem change.
3. The packed CLI payload contains the complete four-skill set plus every relative authority resource needed by the installed skills, with bytes derived from the repository-owned canonical sources and an explicit managed/replaceable marker.
4. Before any target replacement, each invocation prepares all four skills as one staged payload and validates every staged skill with official `skills-ref@0.1.0` from immutable upstream commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`; validator absence/failure, missing/corrupt payload, or other preparation failure exits nonzero and leaves all existing target and unrelated directories byte-for-byte unchanged.
5. A real installation reports whether each of the four targets was installed or replaced, then leaves all four target directories equal to the running package's validated managed payload.
6. A second real installation succeeds and replaces the same four managed targets deterministically; modified content inside any managed target is replaced, with no merge or migration behavior.
7. Unrelated `.agents/skills/` directories and files survive fresh, replacement, repeated, failure, and dry-run cases unchanged.
8. `--dry-run` performs complete discovery/preparation/validation, reports the four planned installed/replaced actions, and changes no target or unrelated bytes.
9. Strict vertical-slice TDD evidence records an observed focused RED for unavailable installer behavior and a focused GREEN after the production slice is implemented.
10. An actual tarball produced by the package's pnpm pack script contains the complete intended boundary, installs into a disposable unrelated consumer, and its generated `jz-trello-flow skills install` command completes both dry-run and real installation against a disposable repository with paths containing spaces and Unicode.
11. Focused package behavior, parser/help/docs regression, package format/lint/typecheck/test/strict publint, official pinned skill validation, repository `pnpm check`, workflow validation, `git diff --check`, and forbidden-activity audits all pass without calling Trello.
12. Passed verification truthfully records the exact tested snapshot and routes the active work item to `reconcile-monorepo-change`; no reconciliation/review self-certification, Git delivery, publication, release, or installation outside disposable test consumers occurs.

## Test seams

- CLI grammar: exact `skills install` positionals, `--dry-run`, output modes if supported by the shared catalog, duplicate/unknown options, and no accidental Trello board/configuration requirement.
- Repository discovery: root invocation, nested invocation, paths with spaces/Unicode, nearest valid ancestor, and no-root error/no-write behavior.
- Payload preparation: all four present, managed markers present, relative authority resources resolve, corrupt/missing payload failure, official pinned validator success/failure, and pre-replacement byte snapshots.
- Installation state: absent targets, modified managed targets, repeated install, four-action installed/replaced reporting, and complete final byte equality.
- Preservation: unrelated skill directories/files and canonical repository source bytes remain unchanged across success, failure, and dry run.
- Atomic preparation boundary: injected or fixture-driven preparation/validation failure occurs before filesystem replacement and proves all targets remain unchanged.
- Documentation/catalog: short help, command catalog, README, packaged guide, docs list/topic/search/JSON behavior, and stable error descriptions.
- Distribution: exact tarball contents, clean disposable pnpm consumer installation, generated Bun shim invocation, nested disposable repository target, and no reliance on monorepo-relative paths.
- Network/credential exclusion: offline command execution with Trello environment variables absent and a test transport that would fail if any Trello path were entered.

## Verification

- TDD evidence: run the exact focused Jest path/test name introduced for the first vertical slice before production code (nonzero RED for the missing behavior), then rerun the same command after implementation (GREEN); preserve commands, exit codes, and failure/pass summaries in `implementation-report.md`.
- Focused/package behavior: `pnpm --filter @jz/ai-arsenal-trello-work-cli test` must pass all package suites including fresh/replacement/repeat/dry-run/preparation-failure/root-discovery/parser/help/docs/packed-consumer cases, with no live suite.
- Package static and boundary gates: `pnpm --filter @jz/ai-arsenal-trello-work-cli format`, `lint`, `typecheck`, and `validate` must pass; inspect the actual tarball generated by `pnpm --filter @jz/ai-arsenal-trello-work-cli pack` against the contract's complete intentional file boundary.
- Official skill conformance: in an isolated environment outside repository dependency state, use official `skills-ref@0.1.0` from `agentskills/agentskills@38a2ff82958afee88dadf4831509e6f7e9d8ef4e` to run `skills-ref validate` for every canonical source, bundled payload skill, and disposable installed skill; all commands must exit 0.
- Packed acceptance: install the actual pnpm-produced tarball into a newly initialized disposable pnpm consumer, invoke that consumer's generated `jz-trello-flow skills install --dry-run` and real command against a disposable nested repository, and prove the four installed payloads plus unrelated-preservation behavior.
- Repository gates: `pnpm check`, `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-jz-trello-flow-skills-install --json`, `node scripts/validate-living-workflow.mjs`, and `git diff --check` must exit 0 on the implementation snapshot.
- Safety audit: inspect changed paths, package allowlist/tarball, environment and command logs to prove no Trello access, credential use, global installation, publication, release/versioning, canonical-skill-source edit, reconciliation, commit, or push occurred.
- Independent review: not self-certified by this implementation agent; passed verification records it as explicitly pending for the supervising agent if the repository's independent-review policy requires it.

## Approval required

No. The bounded additive/replacement behavior affects only explicitly CLI-managed skill directories in disposable tests and target repositories selected by the user; autonomous repository authority applies, with no dangerous deletion or irreversible data loss and no missing hard prerequisite.

## Authority classification

Dangerous deletion or irreversible data loss: `no`
Hard prerequisites: `resolved`
