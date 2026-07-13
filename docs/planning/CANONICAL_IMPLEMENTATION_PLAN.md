# AI Arsenal Canonical Living Implementation Plan

> **Status:** Monorepo work-item pipeline implementation approved and in progress; release CI confirmation deferred
> **Living-plan schema:** 1.0
> **Last reconciled:** 2026-07-13
> **Current phase:** Maintenance / monorepo work-item pipeline implementation
> **Operator view:** `NEXT.md`

---

# 1. Purpose and Authority

This is the single canonical implementation plan for:

- Creating the AI Arsenal monorepo.
- Discovering and migrating the existing TypeScript/Bun `features-cli`.
- Designing its package and distribution model.
- Establishing quality, versioning, testing, and CI.
- Safely cutting consumers over from the old location.
- Keeping implementation and testing synchronized as discoveries occur.

This document merges the former separate monorepo/migration and testing plans.

It is a **living document**. After every verified phase, it must be reconciled so that it reads as the coherent current plan rather than a chronological record of changing assumptions.

Historical evolution belongs in:

- Git history.
- `docs/evidence/`.
- `docs/decisions/`.
- `docs/archive/`.

No second implementation plan may compete with this document.

---

# 2. Evidence Base and Remaining Limitations

Phase 1 directly inspected the CLI source, tests, local instructions, filesystem contracts, live read-only state, disposable mutations, source tooling, and known consumers. Phase 2 established the verified monorepo foundation. Phase 3 recorded the unversioned source baseline, migrated the CLI boundary, added command characterization, and verified source/destination parity. Phase 4 verified the private Bun source package and clean-consumer distribution. Phase 5 added domain/filesystem safety coverage and scoped milestone lock hardening. Phase 6 added black-box process/distribution coverage. Phase 7 added CI, portability verification, and consumer cutover. Phase 8 completed final clean-checkout validation, clean-consumer artifact validation, operating documentation, line-ending policy, hooks/Changesets checks, lockfile/input/stale-path checks, and final reconciliation. The verified maintenance selector update accepts feature slugs, IDs, and full feature directory names through every `--feature` command. Evidence is stored under the corresponding `docs/evidence/` directories.

Remaining limitations:

- The CLI is Git-ignored and junction-shared, so it has no intrinsic version identifier; the source rollback copy remains outside this repository's history.
- Windows and Linux are verified through the public repository's GitHub Actions workflows. macOS remains out of scope until a consumer requires it.
- The package's actual tarball and generated Windows Bun shim have been verified in a clean unrelated consumer; the current tarball is also installed in the Windows user's global pnpm environment.
- npm ownership of `@jz` is not relevant to the selected private initial release and remains unverified.
- Consumer discovery is limited to the source repository, its linked workflow documentation, and installed personal `jz-*` skills visible locally.

---

# 3. Decision Classification

Every material decision uses one of these labels.

| Label           | Meaning                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| `[USER-LOCKED]` | Explicitly decided by the user; change only with approval                     |
| `[VERIFIED]`    | Confirmed from code, configuration, execution, Git evidence, or real workflow |
| `[RECOMMENDED]` | Preferred option based on current evidence and trade-offs                     |
| `[ASSUMPTION]`  | Temporary working assumption that must be verified                            |
| `[OPEN]`        | Requires evidence or user approval                                            |

Reconciliation must update classifications as evidence improves.

---

# 4. Current Verified State

## 4.1 Repository state

- `[VERIFIED]` A pnpm `10.33.0` workspace and Turborepo `2.10.4` task graph exist with a frozen lockfile.
- `[VERIFIED]` The intended monorepo root is `C:\Users\jimzord12\Documents\GitHub\ai-arsenal`.
- `[VERIFIED]` Git is initialized at the monorepo root with public remote `https://github.com/jimzord12/ai-arsenal`; the public `master` branch contains the Phase 7 reconciliation.
- `[VERIFIED]` Root formatting, linting, typechecking, testing, commitlint, Husky/lint-staged, Changesets, and publint tooling are pinned and configured.
- `[VERIFIED]` `packages/features-cli` is a private, self-contained source package boundary for `@jz/ai-arsenal-features-cli` with eight production modules, five migrated source suites, one command-characterization suite, strict TypeScript, Jest 29, linting, coverage, and package documentation.
- `[VERIFIED]` Phase 3 recorded byte sizes and SHA-256 hashes for every top-level non-archive source file immediately before copying; the source still matches all 14 recorded hashes.
- `[VERIFIED]` `archives/v1/` was excluded, production imports depend only on Node built-ins and sibling modules, and the source checkout remains available for rollback.
- `[VERIFIED]` Representative source/migrated workflows match for exit codes, output, normalized schema-v2 state, derived issue JSON, and canonical issue bytes.
- `[VERIFIED]` The migrated suite passes 144 tests across seven suites. Package formatting, linting, strict typechecking, testing, and strict package validation pass for the verified maintenance selector update; public Windows/Linux CI remains the integration gate after merge.
- `[VERIFIED]` `.gitattributes` enforces LF checkout for tracked text files on Windows and Linux, preventing clean-checkout formatter drift and byte-sensitive fixture drift.
- `[VERIFIED]` Phase 5 covers malformed feature and issue JSON, invalid slug mutation safety, stale lock fail-fast behavior, feature-state transaction rollback and fail-closed recovery, direct issue-write partial failure characterization, milestone byte preservation, and shared-lock contention through both module and command boundaries.
- `[VERIFIED]` Milestone mutation now participates in the same repository-level feature-state lock as feature and issue writers. Stale locks remain manual-recovery fail-fast sentinels, and broader issue-mutation transaction refactors are not implemented.
- `[VERIFIED]` Packed artifacts are reproducible and Git-ignored. The current private tarball is installed in the Windows user's global pnpm environment, exposing `features-cli` on `PATH`; it did not mutate user `.scratch` state.
- `[VERIFIED]` The private package exposes only `bin.features-cli = "src/bin.ts"`, blocks package imports with an empty `exports` map, and packs exactly package metadata, README, and eight production TypeScript modules; tests, coverage, configuration, archives, and unrelated files are excluded.
- `[VERIFIED]` The actual tarball passes strict publint, installs into a clean unrelated pnpm consumer, generates a Windows `.CMD` shim that invokes Bun, and completes help plus a disposable schema-v2 feature lifecycle.
- `[VERIFIED]` Automated black-box process coverage invokes the real Bun entrypoint in isolated temporary workspaces. It covers Bun version/help/parser behavior, feature and issue lifecycles, invalid or corrupt state, strict nested `cwd` behavior through paths with spaces and Unicode, idempotency, recovery journals, stale locks, direct issue-write partial failure, and fail-fast feature, issue, and milestone writer contention.
- `[VERIFIED]` Automated distribution coverage packs the actual tarball, installs it into an unrelated temporary pnpm consumer, invokes its generated `features-cli` shim, and verifies schema version `"2"`. The package boundary remains exactly 10 files.
- `[VERIFIED]` No import exports, bundling, standalone binary, runtime dependency, registry publication, or user-state mutation was introduced.
- `[VERIFIED]` The source CLI is `C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system\scripts\features-cli`.
- `[VERIFIED]` The surrounding source worktree is at commit `ef977fe70663329f91c7145006eba93a92a161c3` on branch `remote-logging-system`.
- `[VERIFIED]` The CLI and `.scratch` are Git-ignored junctions into the primary `ics-vcr` checkout; the worktree commit is not a CLI revision.
- `[VERIFIED]` The source worktree had unrelated uncommitted application changes and remained read-only throughout discovery.
- `[VERIFIED]` Phase 1 inspected the implementation and observed real and disposable workflows without modifying source repositories.
- `[VERIFIED]` The documented focused Jest suite passes: 5 suites and 109 tests.
- `[VERIFIED]` Phase 2 verification passed; the source CLI retained matching hashes across 14 top-level files and its focused suite still passes 109 tests.
- `[VERIFIED]` The public repository's separate GitHub Actions quality and portability workflows use frozen pnpm installation, the pinned Node, pnpm, and Bun toolchain, package validation, and a Windows/Linux E2E matrix. Quality run `29206475468` and Portability run `29206475467` passed on the Phase 7 reconciliation.
- `[VERIFIED]` Latest `master` CI also passes on commit `c87a1451742d0fd434bdf104b9e008cfa0c612d5`: Quality run `29206548378` and Portability run `29206548382`.
- `[VERIFIED]` The primary `ics-vcr` checkout and its `remote-logging-system` worktree mount the shared `.scratch` state. The globally installed stable executable and the legacy rollback command both completed read-only `status` checks in those consumers. The three other registered worktrees have neither junction and are not CLI consumers.
- `[VERIFIED]` Phase 8 clean-checkout validation passes with frozen install, formatting, linting, strict typechecking, 139 tests, strict package validation, and workflow validation.
- `[VERIFIED]` Phase 8 clean-consumer validation installs the actual packed tarball into an unrelated temporary consumer, runs help plus a disposable feature lifecycle, verifies schema version `"2"`, and confirms the 10-file package boundary.
- `[VERIFIED]` Hooks and Changesets are operational: lint-staged, commitlint over recent commits, and Changesets status pass.
- `[VERIFIED]` No mixed lockfiles or unabsorbed input plans are present. Stale source-path references are limited to current-truth provenance, documented rollback, and the frozen legacy usage string.
- `[VERIFIED]` The user accepted Phase 8 final validation and operating documentation on 2026-07-12. Source CLI deletion remains explicitly not approved.
- `[VERIFIED]` The user approved public `--feature` selector compatibility on 2026-07-13. Every command accepting `--feature` now accepts an exact slug, a plain or zero-padded positive feature ID, or a matching `ID-slug` directory name; exact slug matching takes precedence, including numeric-only slugs.
- `[VERIFIED]` Changesets generated private package version `0.1.0` and `packages/features-cli/CHANGELOG.md` for flexible feature selectors. The actual 10-file `0.1.0` tarball passes strict publint, installs into a clean unrelated pnpm consumer, and is installed in the Windows user's global pnpm environment. The global command resolves both index and full-name feature selectors in the active `ics-vcr` consumer.
- `[VERIFIED]` `packages/features-cli/AGENTS.md` establishes a self-hosting boundary: use the monorepo living-plan workflow to maintain this package and reserve `features-cli` for consumer-project feature workflows.
- `[USER-LOCKED]` The approved Monorepo Work-Item Pipeline design and implementation plan define the current maintenance change. The user explicitly approved implementation on 2026-07-13, required subagent-driven execution and independent wide review, prohibited release/distribution automation, and prohibited commits or pushes without separate direction.

## 4.2 Product context supplied by the user

- `[USER-LOCKED]` The existing CLI is written in TypeScript and uses Bun.
- `[VERIFIED]` It currently lives at `C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system\scripts\features-cli`.
- `[USER-LOCKED]` Its high-level feature artifact structure uses:

```text
.scratch/
└── features/
    ├── features-status.json
    └── NNN-feature-name/
        ├── Markdown artifacts
        ├── issues-status.json
        └── issues/
```

- `[VERIFIED]` The exact feature, issue, milestone, contract, and progress schemas and transitions are documented in Phase 1 evidence.
- `[VERIFIED]` The exact command, schema, lifecycle, path, output, and error contracts are recorded in Phase 1 evidence.

## 4.3 Monorepo direction

- `[USER-LOCKED]` Repository purpose: AI Arsenal, a collection of the user’s AI-driven software-development tools.
- `[USER-LOCKED]` Workspace/package manager: pnpm.
- `[USER-LOCKED]` Task orchestration and caching: Turborepo.
- `[USER-LOCKED]` Bun remains the existing CLI runtime unless evidence and approval justify a change.
- `[USER-LOCKED]` Package naming prefix: `@jz/ai-arsenal-`.
- `[USER-LOCKED]` Intended CLI package: `@jz/ai-arsenal-features-cli`.
- `[VERIFIED]` `@jz` registry ownership is not required for the private, non-published initial package.
- `[VERIFIED]` Registry publication is not needed in the initial release; the package remains private.

## 4.4 Quality and release direction

- `[USER-LOCKED]` Prefer low-complexity, high-impact tooling.
- `[USER-LOCKED]` Include ESLint and Prettier unless existing equivalent tooling is intentionally retained.
- `[USER-LOCKED]` Include Husky and lint-staged for fast local feedback.
- `[USER-LOCKED]` Use Conventional Commits and commitlint.
- `[USER-LOCKED]` Use Changesets for package versions and changelogs.
- `[USER-LOCKED]` For every user-declared release, including a private locally distributed tarball, choose a SemVer bump with Changesets and run `pnpm version-packages` to produce the package version and changelog. Ask before changing the user's global pnpm installation; never update it automatically.
- `[USER-LOCKED]` Do not automate npm publication in the initial setup.
- `[RECOMMENDED]` Use publint for packable packages.
- `[RECOMMENDED]` Use Are the Types Wrong only when a package exposes TypeScript declarations/imports.
- `[VERIFIED]` The initial CLI package exposes only an executable, so Are the Types Wrong is not applicable.

---

# 5. Project Goal

Create a maintainable AI Arsenal monorepo that:

- Houses reusable tools for AI-driven development.
- Migrates `features-cli` without losing intended behavior.
- Allows safe package-to-package reuse through declared TypeScript package APIs.
- Produces a reliable CLI distribution appropriate to the real user workflow.
- Uses senior-quality architecture without premature abstractions.
- Has deep confidence in filesystem behavior, package installation, and cross-platform execution.
- Is easy for a human to resume after forgetting workflow details.
- Keeps its canonical implementation plan synchronized with implementation reality.

---

# 6. Definition of Done

The project is complete when all approved requirements have been reconciled and verified, including:

## Repository

- A valid pnpm workspace and Turborepo task graph exist.
- Tool versions are deliberately pinned.
- Package boundaries and responsibilities are documented.
- Internal dependencies use package names and the pnpm workspace protocol.
- No mixed package-manager state exists.

## CLI migration

- Intended behavior has been characterized.
- Source provenance is recorded.
- The CLI is migrated into the approved package location.
- It no longer imports private files from the source repository.
- User project paths, package paths, assets, and configuration paths are correctly separated.
- Current consumers have an approved cutover path.
- The source copy is removed only after parity, rollback verification, and explicit deletion approval.

## Package and distribution

- The package name follows the approved `@jz/ai-arsenal-*` convention.
- The selected build and distribution model is verified from a clean environment.
- Packed/published contents are intentional.
- Runtime assets and dependencies are present.
- Package validation appropriate to the package contract passes.
- Registry publication automation remains out of scope unless later approved.

## Quality workflow

- Formatting, linting, type checking, and tests have clear scripts.
- Git hooks remain fast.
- CI is authoritative.
- Conventional Commits and commitlint work.
- Changesets has an explicit package/version/changelog policy.

## Testing

- Test layers match the real architecture.
- High-value domain behavior has unit coverage.
- Filesystem behavior is exercised against real temporary workspaces.
- The real CLI process is tested at the correct boundary.
- The selected distribution artifact is tested from a clean consumer.
- Corrupt state and failed mutations do not silently destroy valid data.
- Concurrency is supported safely, guarded explicitly, or documented as unsupported.
- Supported operating systems pass CI.

## Workflow UX

- `NEXT.md` always identifies the actual next step, requirements, blockers, and purpose.
- The canonical plan represents current truth.
- Every phase completion triggers reconciliation.
- A returning user can confidently resume from a 30-second orientation.
- Important architectural rationale is preserved without polluting the canonical plan.

---

# 7. Canonical Architecture

This is the selected post-discovery architecture. Changes that affect public behavior, persisted state, distribution, or user-locked tooling require approval.

## 7.1 Responsibility boundaries

### pnpm

Owns:

- Dependency installation.
- Workspace linking.
- Lockfile generation.
- Adding/removing dependencies.
- Packing npm-compatible packages.
- Root/package script execution.

Do not use Bun, npm, or Yarn to produce competing dependency state.

### Turborepo

Owns:

- Dependency-aware task orchestration.
- Package filtering.
- Parallel execution.
- Build/test caching where correct.
- Declared task inputs and outputs.

It does not own package installation.

### Bun

For `features-cli`, owns:

- Runtime execution.
- The `#!/usr/bin/env bun` executable contract.

The CLI currently uses Node-compatible APIs rather than `Bun.*`. Do not add bundling or replace Jest merely because Bun provides those capabilities.

## 7.2 Repository layout

Current foundation:

```text
ai-arsenal/
├── .agents/
│   └── skills/
├── .changeset/
│   └── config.json
├── .gitattributes
├── .husky/
│   ├── commit-msg
│   └── pre-commit
├── docs/
│   ├── archive/
│   ├── decisions/
│   ├── evidence/
│   ├── input/
│   ├── planning/
│   └── workflow/
├── packages/
│   └── features-cli/
│       └── package.json
├── scripts/
├── AGENTS.md
├── NEXT.md
├── README.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
└── turbo.json
```

The CLI package now contains:

```text
packages/features-cli/
├── src/
│   ├── bin.ts
│   ├── cli.ts
│   ├── features-state.ts
│   ├── issues-state.ts
│   ├── milestone-progress.ts
│   ├── milestone-state.ts
│   ├── progress-state.ts
│   ├── status-scanner.ts
│   └── *.test.ts
├── test/
│   ├── fixtures/
│   └── characterization.test.ts
├── jest-transformer.cjs
├── jest.config.cjs
├── package.json
├── README.md
└── tsconfig.json
```

Do not create empty directories or packages solely for visual symmetry.

## 7.3 Package boundary policy

- `packages/*`: reusable CLIs, SDKs, libraries, tools, and shared configurations.
- `apps/*`: deployable applications and services.
- Cross-package imports use package names and declared exports.
- Do not import another package through its private `src/` path.
- Do not create generic `common`, `core`, `types`, or `utils` packages until at least two real consumers need a coherent API.
- A root TypeScript config may be simpler than a config package while only one package exists.

## 7.4 Package naming

Valid npm scope structure:

```text
@scope/package-name
```

Approved AI Arsenal convention:

```text
@jz/ai-arsenal-<name>
```

Current intended CLI name:

```text
@jz/ai-arsenal-features-cli
```

Folder names may remain short:

```text
packages/features-cli
```

The verified executable name is `features-cli`. Preserve it.

The package is private in the initial release and exposes no TypeScript import API.

## 7.5 Quality-tooling direction

Verified initial stack:

- ESLint flat config.
- TypeScript ESLint support.
- Prettier.
- `eslint-config-prettier`.
- Husky.
- lint-staged.
- commitlint and `@commitlint/config-conventional`.
- Changesets.
- publint.
- Jest 29-compatible package tests migrated from the source baseline, plus command-boundary characterization.

The root manifest pins Turbo `2.10.4`, TypeScript `6.0.3`, ESLint `10.7.0`, TypeScript-ESLint `8.63.0`, Prettier `3.9.5`, Husky `9.1.7`, lint-staged `17.0.8`, commitlint `21.2.x`, Changesets `2.31.0`, publint `0.3.21`, and Jest `29.7.0`. TypeScript `7` is not used because it is outside the verified TypeScript-ESLint peer range.

Use publint for the packed package. Do not add Are the Types Wrong while the package exposes no TypeScript import surface.

The package-local Jest transformer uses the already pinned TypeScript compiler and produces `coverage/` as a declared Turbo output. Strict package typechecking uses bundler resolution to preserve Bun-compatible extensionless sibling imports. The migrated package retains one narrow lint exception for the characterized fail-closed throw inside `finally`.

Pre-commit hooks should run only fast staged-file checks.

Full tests, builds, package validation, and platform checks belong in explicit scripts and CI.

Tracked text files use LF line endings through `.gitattributes`; preserve that policy so Windows clean checkouts keep formatter and fixture behavior stable.

## 7.6 Test architecture

Required layers:

1. Unit tests for pure domain behavior.
2. Integration tests against the real temporary filesystem.
3. Black-box CLI E2E tests using the real process boundary.
4. Distribution tests against the actual package or executable.
5. Windows and Linux CI for quality and distribution smoke tests.

Current verified coverage includes colocated domain/filesystem suites, an in-process command-characterization suite, and a real-process E2E/distribution suite: 144 tests across seven Jest suites. It covers schema/domain validation, slug/ID/full-name feature selection, status/review/dependency selection, real temporary filesystem persistence, corrupt JSON rejection, recovery-journal fail-closed behavior, stale and held lock behavior, direct issue-write partial failure characterization, strict `cwd` rooting, paths with spaces and Unicode, milestone byte preservation, real concurrent writer fail-fast behavior, and actual packed-artifact installation/invocation from a clean consumer. Public GitHub Actions verifies the quality workflow on Linux and the process/distribution suite on both Windows and Linux.

Preserve Jest initially because the existing 109-test suite uses Jest-specific spies, fake timers, and module access. Use Node subprocess APIs in tests to invoke the real Bun executable; do not couple tests to `Bun.spawn` unless production needs it.

## 7.7 Package and distribution contract

- Package: `@jz/ai-arsenal-features-cli`.
- Folder: `packages/features-cli`.
- Executable: `features-cli`.
- Runtime: Bun `1.3.14` initially, deliberately pinned at the repository level.
- Artifact: npm-compatible source package containing TypeScript executed by Bun.
- Runtime dependencies: none unless migration evidence proves otherwise.
- Registry: private package; no npm publication or publication automation.
- Packed boundary: package metadata, README, and the eight production TypeScript modules only.
- Validation: strict publint packs with pnpm; Are the Types Wrong remains inapplicable because there is no import surface.
- Verified consumption: install the tarball into a clean unrelated pnpm consumer and run `features-cli` through the generated Bun-aware command shim. The current artifact is also installed globally on the Windows consumer machine; the stable executable and legacy rollback command pass read-only smoke checks in the two worktrees that mount the shared `.scratch` state.
- Source CLI and junction remain available for rollback until consumer cutover and explicit deletion approval.

## 7.8 Behavioral and persistence contract

- The invocation `cwd` is the project root; do not add upward root discovery during migration.
- Preserve command names, flags, human output meaning, JSON shape, and `0/1` exit behavior.
- `--feature <selector>` accepts an exact slug, a plain or zero-padded positive ID, or a full `ID-slug` feature directory name. Exact slugs take precedence; a full selector must match both the registered ID and slug.
- Preserve feature state schema version `"2"`, canonical issue Markdown, derived `issues-status.json`, milestone fences, and contract-file derivation.
- Preserve exact-byte behavior for user-authored Markdown outside intended metadata edits.
- Preserve one-writer fail-fast locking for the migration release.
- Treat incomplete atomicity and stale locks as explicit hardening work, not silent migration refactors.

---

# 8. Living-Plan Maintenance Contract

Every phase ends with a mandatory reconciliation gate.

## 8.1 Inputs to reconciliation

- Phase acceptance criteria.
- Executed verification commands and results.
- Git diff and resulting file structure.
- Implementation discoveries.
- New limitations and quirks.
- Requirements learned from the user.
- Newly discovered risks.
- Changes in package/API/filesystem behavior.

## 8.2 Required updates

Reconciliation must inspect and update all affected areas:

- Current verified state.
- User-locked requirements.
- Architecture.
- Package/file paths.
- Current and future phases.
- Test strategy and scenarios.
- Risks and constraints.
- Open decisions.
- Definition of done.
- `NEXT.md`.

## 8.3 Natural rewrite rule

The canonical plan must read like the current coherent plan.

Do not retain plan-diff prose such as:

```text
Originally we intended X, but Phase 2 found Y.
```

Instead write the corrected current truth.

Preserve important historical rationale in an ADR or phase reconciliation report.

## 8.4 Completed phase representation

Once a phase is completed, its section should be rewritten from speculative tasks into:

- Resulting verified state.
- Ongoing invariants.
- Important interfaces.
- Verification that remains relevant.
- Any remaining follow-up moved to the correct future phase.

The phase map may show completion, but status alone is never sufficient.

## 8.5 Idempotency

Running reconciliation twice with no new evidence must not produce wording churn or task reshuffling.

## 8.6 Approval triggers

Stop for user approval when reconciliation would:

- Modify a user-locked requirement.
- Change public behavior or persisted formats.
- Add a major dependency or external service.
- Expand scope materially.
- Introduce meaningful cost/security/privacy/operations.
- Change the approved distribution direction.
- Remove user data or the original source copy.
- Proceed beyond the post-discovery implementation gate.

---

# 9. Phase Map

| Phase | Name                                                     | Current status  | Main output                                          | Approval gate        |
| ----- | -------------------------------------------------------- | --------------- | ---------------------------------------------------- | -------------------- |
| 0     | Workflow Bootstrap and Repository Orientation            | **Complete**    | Valid workflow state and organized inputs            | Satisfied            |
| 1     | CLI Discovery, Workflow Observation, and Plan Grounding  | **Complete**    | Evidence-grounded canonical plan                     | Satisfied            |
| 2     | Monorepo Foundation and Developer Workflow               | **Complete**    | pnpm/Turbo root and quality workflow                 | Satisfied            |
| 3     | CLI Characterization and Migration Boundary              | **Complete**    | Behavior baseline and migrated package boundary      | Satisfied            |
| 4     | Build, Packaging, and Distribution                       | **Complete**    | Verified distribution artifact                       | Satisfied            |
| 5     | Domain and Filesystem Test Foundation                    | **Complete**    | Unit/integration confidence and data-safety contract | Satisfied            |
| 6     | CLI E2E and Distribution Testing                         | **Complete**    | Real process and clean-consumer confidence           | Satisfied            |
| 7     | CI, Portability, Consumer Cutover, and Source Retirement | **Complete**    | Verified CI and safe consumer cutover                | Source deletion gate |
| 8     | Final Validation and Operating Documentation             | **Complete**    | Release-ready verified repository                    | Final acceptance     |
| M1    | Flexible Feature Selector Compatibility                  | **Merged**      | Compatible public `--feature` selection              | CI confirmation      |
| M2    | Monorepo Work-Item Pipeline                              | **In progress** | Verified artifact-driven maintenance workflow        | Approved             |

---

# 10. Phase 0 — Workflow Bootstrap and Repository Orientation

### Resulting verified state

- The effective repository root is `C:\Users\jimzord12\Documents\GitHub\ai-arsenal`.
- Git is initialized at that root with the public `master` branch and the initial commit in the public remote.
- All starter files were inventoried; no additional user inputs or superseded plans require organization.
- Required workflow files and all three repository-scoped skills are present.
- The workflow validator passes under Node.
- The source CLI location, worktree root, branch, and commit are recorded in Phase 0 evidence.
- No production code was moved, no dependencies were installed, and no monorepo files were scaffolded.

## Ongoing invariants

- Keep source inspection read-only outside an approved migration/cutover phase because the worktree contains unrelated changes.
- Preserve the source CLI in place until migration parity, consumer cutover, rollback verification, and explicit deletion approval.
- Store new discovery evidence under `docs/evidence/phase-01-discovery/`.

## Verification evidence

- `docs/evidence/phase-00-workflow-bootstrap/inventory.md`
- `docs/evidence/phase-00-workflow-bootstrap/verification.md`
- `docs/evidence/phase-00-workflow-bootstrap/reconciliation.md`

---

# 11. Phase 1 — CLI Discovery, Workflow Observation, and Plan Grounding

## Outcome

The generic starter plan is now grounded in the actual CLI, workflows, consumers, tests, and risks.

## Resulting verified state

- Source provenance and its Git-ignore/junction limitation are recorded.
- CLI architecture, command surface, schemas, path behavior, error behavior, and consumer coupling are mapped.
- Real read-only routing plus disposable feature, issue, invalid-request, and recovery workflows were observed.
- The documented focused suite passes 109 tests across five suites.
- Current data-safety gaps and test gaps are explicit.
- Jest remains the initial test runner; Bun remains the runtime.
- The selected distribution is a private npm-compatible source package requiring Bun, verified through a packed tarball.
- Windows and Linux are the initial CI platforms; macOS remains unsupported until required.
- The initial concurrency policy is one writer with fail-fast contention; broad hardening is separately staged and must preserve schemas and behavior.

## Ongoing evidence

- `docs/evidence/phase-01-discovery/discovery-report.md`
- `docs/evidence/phase-01-discovery/command-inventory.md`
- `docs/evidence/phase-01-discovery/workflow-observations.md`
- `docs/evidence/phase-01-discovery/consumer-inventory.md`
- `docs/evidence/phase-01-discovery/risk-register.md`
- `docs/evidence/phase-01-discovery/verification.md`
- `docs/evidence/phase-01-discovery/deviation-report.md`
- `docs/evidence/phase-01-discovery/reconciliation.md`
- `docs/evidence/phase-01-discovery/approval.md`

## Approval gate

**Satisfied on 2026-07-12:** the user explicitly approved the reconciled plan and selected trade-offs before Phase 2.

---

# 12. Phase 2 — Monorepo Foundation and Developer Workflow

## Resulting verified state

- The root is a private pnpm `10.33.0` workspace with a frozen `pnpm-lock.yaml`.
- Turborepo `2.10.4` has package tasks for formatting, linting, typechecking, testing, packing, and validation.
- Node `24.5.0` and Bun `1.3.14` pins match the installed toolchain.
- ESLint flat config, TypeScript-ESLint, Prettier, Husky, lint-staged, commitlint, Changesets, publint, TypeScript, and Jest are pinned and configured.
- Fast pre-commit and commit-message hooks pass without creating a commit.
- `@jz/ai-arsenal-features-cli` exists only as a private package manifest; no CLI source was moved.
- The root README documents installation, command ownership, workspace responsibilities, and the private release policy.

## Ongoing invariants

- pnpm alone owns dependency state; no competing lockfile exists.
- Root package tasks delegate to the migrated package's real formatting, linting, strict typechecking, testing, packing, and validation scripts.
- Root JavaScript remains compiler-checked without imposing strict `checkJs` on the existing workflow validator; the CLI package has its own strict TypeScript configuration.
- Turbo test outputs remain empty until the migrated suite produces real coverage artifacts.
- The initial repository commit now exists, so root Changesets status is no longer blocked by unborn history.
- The source CLI remains read-only and unchanged.

## Verification evidence

- `docs/evidence/phase-02-monorepo-foundation/verification.md`
- `docs/evidence/phase-02-monorepo-foundation/source-preservation.md`
- `docs/evidence/phase-02-monorepo-foundation/reconciliation.md`

---

# 13. Phase 3 — CLI Characterization and Migration Boundary

## Resulting verified state

- The unversioned source baseline is identified by a fresh inventory of 14 top-level non-archive files with byte sizes and SHA-256 hashes.
- Eight production modules and the five-suite, 109-test source baseline are migrated under `packages/features-cli/src/`; the adapted README and package-local Jest/TypeScript configuration are present.
- Nine new command-characterization tests cover help, status/progress JSON, feature and issue lifecycles, invalid input, recovery-required state, strict `cwd` rooting, BOM/CRLF preservation, and held-lock failure.
- The migrated package retains strict typechecking, linting, formatting, repository-wide checks, and the expanded test suite summarized in Current Verified State.
- Representative source and migrated workflows match in exit behavior, output, normalized persisted state, derived state, and canonical user-authored bytes.
- `archives/v1/` is absent from the package; the original CLI, archive, and source hashes remain available for rollback.
- Production imports have no source-checkout dependency. The legacy secondary-entrypoint usage string remains frozen public output, not a runtime path dependency.

## Ongoing invariants

- Preserve commands, output meaning, exit behavior, parser behavior, lifecycle rules, schema version `"2"`, canonical Markdown, derived JSON, exact user-authored bytes, fail-fast locking, recovery behavior, and strict invocation-`cwd` semantics.
- Keep the source copy read-only and available until consumer cutover, rollback verification, and explicit deletion approval.
- Retain `status-scanner.ts` until later coverage and obsolete-module review justify removal.
- Keep tests isolated from real `.scratch` data and retain Jest 29 until an approved change proves a safer replacement.

## Verification evidence

- `docs/evidence/phase-03-cli-migration/source-provenance.md`
- `docs/evidence/phase-03-cli-migration/parity.md`
- `docs/evidence/phase-03-cli-migration/verification.md`
- `docs/evidence/phase-03-cli-migration/reconciliation.md`

---

# 14. Phase 4 — Build, Packaging, and Distribution

## Resulting verified state

- `@jz/ai-arsenal-features-cli` remains private and source-distributed, exposes only the stable `features-cli` executable at `src/bin.ts`, blocks deep imports with an empty `exports` map, requires Bun `1.3.14`, and has no import API.
- The explicit packed boundary contains exactly `package.json`, `README.md`, and the eight production TypeScript modules. Tests, fixtures, coverage, Turbo logs, configuration, archives, and unrelated files are excluded.
- `pnpm --filter @jz/ai-arsenal-features-cli pack` produces the intended tarball, and strict publint passes both the package's pnpm-packed view and the actual tarball.
- A clean unrelated temporary pnpm consumer installs the tarball. Its generated Windows `.CMD` shim invokes Bun from `PATH`, help succeeds, and a disposable init/create/update/get lifecycle persists schema version `"2"` with the expected state.
- The temporary consumer was removed after verification. No user `.scratch` data, persistent consumer installation, source checkout, public behavior, schema, registry, or publication automation changed.

## Ongoing invariants

- Keep the artifact as TypeScript source executed by Bun; bundling, standalone binaries, import exports, automated publication, and new runtime dependencies require evidence and approval.
- Keep the explicit packed boundary synchronized with production modules and verify the actual tarball, not a workspace link.
- Use `pnpm run pack` when invoking the root Turbo script; bare root `pnpm pack` is pnpm's built-in root-package command.
- Preserve the original source and archive until consumer cutover, rollback verification, and explicit deletion approval.

## Verification evidence

- `docs/evidence/phase-04-build-packaging-distribution/verification.md`
- `docs/evidence/phase-04-build-packaging-distribution/reconciliation.md`

---

# 15. Phase 5 — Domain and Filesystem Test Foundation

## Resulting verified state

- The package has 125 passing Jest tests across six suites.
- Domain coverage includes feature schema validation, slug safety, feature lifecycle constraints, issue status/review transitions, blocker/dependency selection, resumable issue selection, milestone parsing, milestone dependency validation, and milestone/issue reconciliation.
- Filesystem coverage uses isolated temporary workspaces for initialization, feature and issue persistence, corrupt feature and issue JSON, strict invocation-`cwd` behavior, recovery-required fail-closed behavior, held and stale lock behavior, direct issue-write partial failure characterization, and user-authored milestone byte preservation.
- Feature-state multi-file updates use a recovery journal and rollback tested against both successful rollback and rollback failure.
- Feature, issue, and milestone writers share the repository-level `.scratch/features-status.lock` fail-fast writer lock.
- Milestone mutation is tested through both module and command boundaries while another writer holds the shared lock.
- Stale-looking lock files are treated as manual-recovery sentinels and are not automatically removed.
- Direct issue mutations remain non-transactional: a derived-state write failure after an issue Markdown rewrite can leave the issue file updated while derived issue state is absent or stale and feature registry timestamps remain unchanged. The lock is still released. This behavior is characterized for future hardening decisions.

## Ongoing invariants

- Preserve public CLI behavior, schema version `"2"`, existing command output shape, exact user-authored bytes, strict `cwd` semantics, the private Bun source distribution, and the explicit packed file boundary.
- Keep stale lock auto-recovery out of scope unless evidence and approval justify it.
- Do not broaden transaction refactors for issue Markdown, derived issue state, or feature registry timestamps without approval.
- Keep tests isolated from real `.scratch` data.

## Verification evidence

- `docs/evidence/phase-05-domain-filesystem-test-foundation/verification.md`
- `docs/evidence/phase-05-domain-filesystem-test-foundation/reconciliation.md`

---

# 16. Phase 6 — CLI E2E and Distribution Testing

## Resulting verified state

- `packages/features-cli/test/e2e.test.ts` runs the real Bun entrypoint rather than calling the CLI module in-process. Every test uses a removed temporary workspace; no user `.scratch` data or consumer path is touched.
- The process contract is verified for Bun version, help, parser failure, feature and issue lifecycle, invalid/missing entities, malformed state, idempotency, recovery-journal hard stop, stale lock preservation, strict nested `cwd`, and paths with spaces and Unicode. It checks process exit code, stdout/stderr, persisted state, and unrelated-file preservation where relevant.
- The direct issue-write partial-failure boundary is confirmed at the process boundary: when derived issue-state writing fails after canonical Markdown is updated, the command exits `1`, the Markdown update remains, feature registry bytes remain unchanged, and the writer lock is released. No broad transaction hardening was introduced.
- Real concurrent feature, issue, and milestone CLI writers prove the shared repository lock permits one writer and makes the competing process fail fast. Stale locks remain manual-recovery sentinels and are not auto-recovered.
- The E2E suite packs the actual source artifact, installs it into an unrelated temporary pnpm consumer, invokes `features-cli` through the installed command shim, and verifies schema version `"2"`. The selected private Bun source distribution and its 10-file packed boundary are unchanged.

## Ongoing invariants

- Preserve public CLI behavior, schema version `"2"`, exact user-authored bytes outside intended metadata edits, strict invocation-`cwd` semantics, fail-fast locking, recovery hard stops, and the private Bun source distribution.
- Keep process and distribution tests isolated from user state and workspace links.
- Do not add stale-lock auto-recovery or broaden issue mutation transactions without evidence and approval.
- Phase 7 now verifies Windows/Linux CI and consumer cutover. Preserve the source rollback copy until its separate deletion gate.

## Verification evidence

- `docs/evidence/phase-06-cli-e2e-distribution-testing/verification.md`
- `docs/evidence/phase-06-cli-e2e-distribution-testing/reconciliation.md`

---

# 17. Phase 7 — CI, Portability, Consumer Cutover, and Source Retirement

## Resulting verified state

- `.github/workflows/quality.yml` defines an Ubuntu quality gate with frozen pnpm installation, formatting, linting, typechecking, unit/integration tests with coverage, and strict packed-artifact validation.
- `.github/workflows/portability.yml` defines a non-fail-fast Windows/Linux matrix that executes the real-process E2E suite. That suite includes the actual packed-artifact install/invocation, path, and writer-contention cases.
- Both workflows use the pinned Node, pnpm, and Bun versions and have read-only repository permissions. Quality run `29206253391` passed on Linux; Portability run `29206253402` passed on Ubuntu and Windows.
- The first CI run exposed a Linux-only Corepack path assumption in the E2E harness. The harness now uses the setup-provided `pnpm` command on Linux, retains the Windows Corepack invocation workaround, and suppresses only Corepack's first-download prompt. No CLI behavior or persisted schema changed.
- The current packed artifact is installed globally through pnpm, exposing the stable `features-cli` command. The primary `ics-vcr` checkout and the `remote-logging-system` worktree pass read-only stable-command and legacy-roll-back-command smoke checks against their shared `.scratch` state.
- The Spec-to-Ship workflow documentation and the five personal `jz-*` consumers use the stable executable; no personal consumer retains a direct `scripts/features-cli` or `npx tsx` invocation. The three other registered `ics-vcr` worktrees have no `.scratch` or source-CLI junction, so they are not CLI consumers.
- `docs/operations/features-cli-cutover.md` records global installation, read-only smoke verification, rollback, and the source-deletion gate. The source still matches all 14 recorded SHA-256 hashes.

Windows is required. Linux is the portability target. macOS is out of scope until a consumer requires it.

## Source deletion gate

Do not remove the old `scripts/features-cli` until:

- Behavior parity is approved.
- Consumers are migrated.
- CI passes.
- Rollback is documented.
- The user explicitly approves deletion.

## Reconciliation gate

Complete on 2026-07-12. Phase 8 is the next approved-plan gate; source deletion remains separately approval-controlled.

---

# 18. Phase 8 — Final Validation and Operating Documentation

## Resulting verified state

- Complete local and clean-checkout verification passes with the pinned Node, pnpm, and Bun toolchain.
- Clean-checkout validation on Windows exposed and fixed the missing repository line-ending policy. `.gitattributes` now keeps tracked text files on LF, and ADR `docs/decisions/0001-line-ending-policy.md` records the rationale.
- The actual packed source artifact installs into an unrelated temporary consumer, exposes the `features-cli` command, completes a disposable schema-v2 feature lifecycle, and retains the exact 10-file package boundary.
- Hook and release workflow checks pass: lint-staged, commitlint, and Changesets status.
- `pnpm-lock.yaml` remains the only repository lockfile, and no unabsorbed input plans are pending.
- Active source-path references are limited to source provenance, rollback documentation, and the frozen legacy usage string.
- Root and package documentation describe installation, architecture, development commands, package validation, consumer invocation, Changesets usage, private release policy, constraints, and approval gates.
- Latest public Quality and Portability workflow runs pass on `master`.

## Final acceptance

The user accepted the completed migration and operating documentation on 2026-07-12. Source CLI deletion remains a separate approval gate and is not approved.

## Reconciliation gate

Complete on 2026-07-12. User final acceptance was received.

---

## Maintenance update — Flexible Feature Selector Compatibility

### Resulting verified state

- Every `--feature` command shares selector resolution that accepts a slug, plain or zero-padded feature ID, and a matching full `ID-slug` name.
- Exact slug lookup remains first so a registered numeric-only slug is not reinterpreted as an ID.
- A full selector with a registered ID but a different slug fails with the expected full name instead of selecting by ID alone.
- Package formatting, linting, strict typechecking, strict publint package validation, and all 144 tests pass.

### Reconciliation gate

The user approved this public CLI behavior change on 2026-07-13. It was merged and pushed on `master` as `332cff2`; GitHub Actions had not yet exposed new runs for that commit at the latest check. The user also approved the private `0.1.0` release through the Changesets workflow and its global installation.

---

## Maintenance update — Private `0.1.0` Release

### Resulting verified state

- The private package version is `0.1.0`, generated from the approved minor Changeset; `CHANGELOG.md` contains the selector compatibility entry.
- Root quality verification passes with all 144 tests, and strict publint passes against the `0.1.0` packed package.
- The actual 10-file tarball installs as `@jz/ai-arsenal-features-cli@0.1.0` in an unrelated temporary consumer and its installed `features-cli --help` command succeeds.
- The user approved replacement, and pnpm globally resolves `@jz/ai-arsenal-features-cli@0.1.0`. The installed `features-cli` command passed read-only active-consumer smoke checks for index `3` and full name `003-remote-logging-mvp-v2`.

### Reconciliation gate

The user approved versioning, changelog generation, release verification, commit/push, and global installation. The remaining release-handoff check is confirmation of the new `master` CI runs when GitHub exposes them.

---

## Maintenance update — Monorepo Work-Item Pipeline

### Approved implementation state

- The approved design defines a read-only router plus eight narrow write-capable stages from request capture through reconciliation.
- Durable work-item artifacts use explicit revisions, prerequisite revisions, statuses, historical revision retention, and an approval record bound to the exact plan bytes by SHA-256.
- The pipeline remains separate from consumer `.scratch/features/` workflows and ends before release, packing, publication, global installation, or source deletion.
- Implementation follows the approved task plan with focused checks, an end-to-end disposable simulation, three independent review lenses, targeted repair, complete verification, and final reconciliation.

### Approval gate

Implementation was explicitly approved on 2026-07-13. Commit and push remain separately approval-controlled. The pending `master` CI confirmation is deferred until this maintenance phase is verified and reconciled.

---

# 19. Current Risks

| Risk                                                                                                               | Current status                    | Required resolution                                                                                             |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Source rollback copy can drift after its captured baseline                                                         | Controlled                        | The 14-file inventory matched during cutover; preserve the source copy through its explicit deletion gate       |
| Direct issue mutations can leave issue Markdown ahead of derived JSON and feature timestamps after a write failure | Characterized open risk           | Real-process boundary is verified; broaden transaction hardening only with approval                             |
| Stale locks require manual recovery                                                                                | Accepted, test-backed constraint  | Preserve fail-fast behavior; do not automate without evidence and approval                                      |
| Skills depend on paths, output, and schemas                                                                        | Controlled for cut-over consumers | Stable-command instructions and two read-only worktree smoke checks are verified; preserve the rollback command |
| Wrong `cwd` targets the wrong `.scratch`                                                                           | Controlled by E2E                 | Preserve documented root invocation; no upward discovery                                                        |
| Windows junction/path behavior may regress                                                                         | Controlled by CI and smoke checks | Preserve the stable `cwd` contract and shared-junction rollback path                                            |
| Linux portability regression                                                                                       | Resolved by CI                    | Keep the public Ubuntu matrix as the portability regression gate                                                |
| Windows line-ending drift may break formatting or byte-sensitive fixtures                                          | Controlled                        | Preserve `.gitattributes` LF policy                                                                             |
| User-authored Markdown may be damaged by hardening                                                                 | Controlled by tests               | Preserve byte-level milestone tests and extend before any broader mutation hardening                            |
| Separate plans could drift                                                                                         | Controlled                        | Single canonical plan                                                                                           |
| Human forgets workflow state                                                                                       | Controlled by design              | `NEXT.md` and session contract                                                                                  |
| Agent skips reconciliation                                                                                         | Controlled by workflow            | Required skills and gates                                                                                       |

Reconciliation must remove resolved risks and add newly material risks.

---

# 20. Current Open Decisions

Phase 8 final validation is complete and accepted. Source deletion remains separately approval-controlled and is not approved.

Broad transaction hardening for issue Markdown, derived issue state, and feature registry timestamp coupling remains an approval-controlled decision. Phase 6 confirms the existing partial-write boundary without showing a distribution or process failure that changes that decision.

Later explicit gates remain for any public behavior/schema change, material tooling or distribution deviation, and source deletion.

---

# 21. Explicit Initial Non-Goals

Unless discovery and user approval change scope:

- Automated npm publishing.
- Semantic-release or release-please alongside Changesets.
- Remote Turborepo caching.
- Docker.
- A documentation website.
- Multiple release channels.
- Native binaries for every platform.
- Generic shared `core`, `types`, or `utils` packages.
- Replacing Bun.
- Replacing the CLI command framework.
- Redesigning `.scratch/`.
- Silent schema migrations.
- Broad unrelated refactoring.
- Full test/build execution inside Git hooks.
- Treating the canonical plan as a changelog.

---

# 22. Phase Evidence Contract

For each phase, store concise evidence under:

```text
docs/evidence/phase-XX-<name>/
```

Recommended contents:

- `verification.md`: commands, exit codes, key output.
- `reconciliation.md`: compact summary of plan updates and approval needs.
- Additional reports specific to the phase.

Do not dump excessive raw logs into the repository unless they are genuinely useful. Prefer concise evidence plus references to CI/Git commits.

---

# 23. Reconciliation Report Format

Use:

```text
Phase:
Verification:
Resulting system state:
Discoveries:
Canonical plan updates:
NEXT.md update:
Approval required:
```

The reconciliation report is historical evidence.

The canonical plan itself must contain only current truth.

---

# 24. Immediate Next Step

Implement and verify the approved Monorepo Work-Item Pipeline plan, perform the required independent wide review and targeted repairs, then reconcile the living workflow. Do not add release, packing, publication, global-installation, or source-deletion automation. Do not commit or push without explicit user direction.
