# AI Arsenal Canonical Living Implementation Plan

> **Status:** Workflow v2 review-barrier integration, fail-closed CLI delivery evidence, isolated worktree-per-item development, legacy Features CLI junction retirement, repaired weekly-report CLI `0.1.1`, and Trello Flow CLI `0.6.0` version flags are delivered
> **Living-plan schema:** 1.0
> **Last reconciled:** 2026-08-04
> **Current phase:** Trello Flow CLI authoring and discovery UX is next
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

- The retired legacy CLI was Git-ignored and junction-shared, so it had no intrinsic version identifier; verified packed private artifacts are the rollback route.
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

- `[VERIFIED]` A pnpm `11.7.0` workspace and Turborepo `2.10.4` task graph exist with a frozen lockfile.
- `[VERIFIED]` The intended monorepo root is `C:\Users\jimzord12\Documents\GitHub\ai-arsenal`.
- `[VERIFIED]` Git is initialized at the monorepo root with public remote `https://github.com/jimzord12/ai-arsenal`; the public `master` branch contains the Phase 7 reconciliation.
- `[VERIFIED]` Root formatting, linting, typechecking, testing, commitlint, Husky/lint-staged, Changesets, and publint tooling are pinned and configured.
- `[VERIFIED]` `packages/features-cli` is a private, self-contained source package boundary for `@jz/ai-arsenal-features-cli` with nine production modules, five migrated source suites, one command-characterization suite, strict TypeScript, Jest 29, linting, coverage, and package documentation.
- `[VERIFIED]` Phase 3 recorded byte sizes and SHA-256 hashes for every top-level non-archive source file immediately before copying; that inventory remains migration evidence.
- `[VERIFIED]` `archives/v1/` was excluded, production imports depend only on Node built-ins and sibling modules, and verified packed private artifacts provide rollback.
- `[VERIFIED]` Representative source/migrated workflows match for exit codes, output, normalized schema-v2 state, derived issue JSON, and canonical issue bytes.
- `[VERIFIED]` The migrated suite passes 144 tests across seven suites. Package formatting, linting, strict typechecking, testing, and strict package validation pass for the verified maintenance selector update; public Windows/Linux CI remains the integration gate after merge.
- `[VERIFIED]` `.gitattributes` enforces LF checkout for tracked text files on Windows and Linux, preventing clean-checkout formatter drift and byte-sensitive fixture drift.
- `[VERIFIED]` Phase 5 covers malformed feature and issue JSON, invalid slug mutation safety, stale lock fail-fast behavior, feature-state transaction rollback and fail-closed recovery, direct issue-write partial failure characterization, milestone byte preservation, and shared-lock contention through both module and command boundaries.
- `[VERIFIED]` Milestone mutation now participates in the same repository-level feature-state lock as feature and issue writers. Stale locks remain manual-recovery fail-fast sentinels, and broader issue-mutation transaction refactors are not implemented.
- `[VERIFIED]` Packed artifacts are reproducible and Git-ignored. The current private tarball is installed in the Windows user's global pnpm environment, exposing `features-cli` on `PATH`; it did not mutate user `.scratch` state.
- `[VERIFIED]` The private package exposes only `bin.features-cli = "src/bin.ts"`, blocks package imports with an empty `exports` map, and packs exactly package metadata, README, and nine production TypeScript modules; tests, coverage, configuration, archives, and unrelated files are excluded.
- `[VERIFIED]` The actual tarball passes strict publint, installs into a clean unrelated pnpm consumer, generates a Windows `.CMD` shim that invokes Bun, and completes help plus a disposable schema-v2 feature lifecycle.
- `[VERIFIED]` Automated black-box process coverage invokes the real Bun entrypoint in isolated temporary workspaces. It covers Bun version/help/parser behavior, feature and issue lifecycles, invalid or corrupt state, strict nested `cwd` behavior through paths with spaces and Unicode, idempotency, recovery journals, stale locks, direct issue-write partial failure, and fail-fast feature, issue, and milestone writer contention.
- `[VERIFIED]` Automated distribution coverage packs the actual tarball, installs it into an unrelated temporary pnpm consumer, invokes its generated `features-cli` shim, and verifies schema version `"2"`. The package boundary remains exactly 10 files.
- `[VERIFIED]` No import exports, bundling, standalone binary, runtime dependency, registry publication, or user-state mutation was introduced.
- `[VERIFIED]` The legacy source junction at `C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system\scripts\features-cli` has been retired; its former target was already absent.
- `[VERIFIED]` The surrounding source worktree remains consumer context at commit `ef977fe70663329f91c7145006eba93a92a161c3` on branch `remote-logging-system`; it is not a CLI revision.
- `[VERIFIED]` The shared `.scratch` junction remains intact, and the legacy source junction removal did not traverse a target.
- `[VERIFIED]` Phase 1 inspected the implementation and observed real and disposable workflows without modifying source repositories.
- `[VERIFIED]` The documented focused Jest suite passes: 5 suites and 109 tests.
- `[VERIFIED]` Phase 2 verification passed; the source CLI retained matching hashes across 14 top-level files and its focused suite still passes 109 tests.
- `[VERIFIED]` The public repository's separate GitHub Actions quality and portability workflows use frozen pnpm installation, the pinned Node, pnpm, and Bun toolchain, package validation, and a Windows/Linux E2E matrix. Quality run `29206475468` and Portability run `29206475467` passed on the Phase 7 reconciliation.
- `[VERIFIED]` Latest `master` CI also passes on commit `c87a1451742d0fd434bdf104b9e008cfa0c612d5`: Quality run `29206548378` and Portability run `29206548382`.
- `[VERIFIED]` The primary `ics-vcr` checkout and its `remote-logging-system` worktree mount the shared `.scratch` state. The globally installed stable executable completed read-only `status` checks in both consumers after legacy junction retirement. The three other registered worktrees have no `.scratch` state and are not CLI consumers.
- `[VERIFIED]` Phase 8 clean-checkout validation passes with frozen install, formatting, linting, strict typechecking, 139 tests, strict package validation, and workflow validation.
- `[VERIFIED]` Phase 8 clean-consumer validation installs the actual packed tarball into an unrelated temporary consumer, runs help plus a disposable feature lifecycle, verifies schema version `"2"`, and confirms the 10-file package boundary.
- `[VERIFIED]` Hooks and Changesets are operational: lint-staged, commitlint over recent commits, and Changesets status pass.
- `[VERIFIED]` No mixed lockfiles or unabsorbed input plans are present. Legacy source-path references are limited to retired-path provenance and historical migration evidence.
- `[VERIFIED]` The user accepted Phase 8 final validation and operating documentation on 2026-07-12, then approved and completed retirement of the dangling legacy source junction.
- `[VERIFIED]` The user approved public `--feature` selector compatibility on 2026-07-13. Every command accepting `--feature` now accepts an exact slug, a plain or zero-padded positive feature ID, or a matching `ID-slug` directory name; exact slug matching takes precedence, including numeric-only slugs.
- `[VERIFIED]` Changesets generated private package version `0.1.0` and `packages/features-cli/CHANGELOG.md` for flexible feature selectors. The actual 10-file `0.1.0` tarball passes strict publint, installs into a clean unrelated pnpm consumer, and is installed in the Windows user's global pnpm environment. The global command resolves both index and full-name feature selectors in the active `ics-vcr` consumer.
- `[VERIFIED]` `packages/features-cli/AGENTS.md` establishes a self-hosting boundary: use the monorepo living-plan workflow to maintain this package and reserve `features-cli` for consumer-project feature workflows.
- `[VERIFIED]` The monorepo work-item pipeline is fully implemented and independently verified. Its 30-test workflow suite covers strict active registration, direct-user revision requests, contract/plan archive-and-increment recovery, fresh approval binding, failed-verification recovery, skill structure, and disposable lifecycle routing; the full repository check passes.
- `[VERIFIED]` Workflow v2 provisions each new item on `work/<work-item-id>` in its deterministic sibling worktree and fails closed outside that exact registered branch/worktree. Artifact commit `e443c85cfb5ab0812b79057f217dc9f9d75c68e7` passed fresh independent review, the full repository gate, Quality run `30902781283`, and Windows/Linux Portability run `30902781295`; delivery intentionally retains the branch and worktree.
- `[VERIFIED]` `packages/trello-work-cli` is the private TypeScript package `@jz/ai-arsenal-trello-work-cli`. Its Work Unit V1 boundary implements deterministic parsing and schema enforcement, explicit stateless board selection, seven-list canonical workflow defaults with environment overrides, guarded workflow initialization, board-scoped list CRUD, dry-run plans, references, strict CLI parsing, version-guarded mutations, durable operation replay, partial-recovery signaling, secret redaction, API request construction, and built-in documentation.
- `[VERIFIED]` Exact operation replay is resolved before ordinary stale-version rejection for update, transition, reconcile, and checklist mutations, while every new write remains version-guarded. Metadata/description replay re-verifies title, all request-managed metadata, and every section before returning `recovered`.
- `[VERIFIED]` The Trello CLI supports ordinary Inbox cards and canonical Draft Work Units, `jz-trello-flow inbox list`, explicit `jz-trello-flow draft create`, the deprecated `jz-trello-flow create` alias, same-card `jz-trello-flow design start` promotion, canonical partial `in_design`, and strict In Design-to-Ready completeness gating. Malformed cards claiming Work Unit identity fail closed, and design operation IDs are checked board-wide before mutation.
- `[VERIFIED]` Versioned source `0.6.0` provides credential-free top-level `jz-trello-flow -v` and `jz-trello-flow --version` output before ordinary parsing or configuration loading, and strictly normalizes native Trello card members as deterministic `id`, `username`, and `fullName` objects in `get`, `list`, and Inbox output. Without `--member`, list output remains normalized Work Units only. `list --member` searches every visible/open board card, returns ordinary cards and Work Units in the established discriminated shapes, matches an exact member ID or case-insensitive exact username, and rejects display-name and substring matching. Trello `visible` filtering excludes archived lists; explicit `closed` response filtering also excludes archived cards in open lists. Work Unit metadata filters exclude ordinary cards and compose conjunctively, while exact metadata `--owner` remains distinct. Native members remain plural Trello assignment/attention state; owner remains the single stable agent or worker execution claim, with no automatic synchronization or member mutation.
- `[VERIFIED]` The revised Trello CLI passes formatting, linting, strict typechecking, strict publint, 230 offline tests across 19 suites, repository-wide checks, 30 workflow tests, and credential-free verification of its gated live harness with 12 checks passing and 2 live cases skipped. Final independent review of the exact snapshot found no Critical or High issue.
- `[VERIFIED]` Live validation remained allowlisted to `TestingBoard` (`6a16bbf1fea5389eb39636b7`). The revised seven-list onboarding harness independently initialized its preconditions, covered ordinary-card and Draft intake with full-card-scoped operation IDs, and passed all 14 checks. Generated Work Units remain in Done, the Inbox is empty, and disposable run lists are closed.
- `[VERIFIED]` Active canonical Trello workflow resolution and guarded initialization ignore archived exact-name candidates, keep two open namesakes ambiguous, create a new open canonical list when only archived namesakes exist, and reject archived configured mappings before active card-placement or transition handlers. Explicit archived-list ID reads, close replay, cleanup verification, and open/archived audit visibility remain supported because the Trello client still returns all lists.
- `[VERIFIED]` The private `@jz/ai-arsenal-trello-work-cli` package is globally installed as `0.6.0`, exposing only `jz-trello-flow`. Artifact commit `343e240cf3232600ad2704c400d585bd09146796` passed [Quality](https://github.com/jimzord12/ai-arsenal/actions/runs/30750430697) and [Windows/Linux Portability](https://github.com/jimzord12/ai-arsenal/actions/runs/30750430747). Its exact 32-file tarball SHA-256 is `c842e57ad900c717b572d6f117b99c8bb49f7b1faa00841995ff8b96232329b4`; the installed `src/cli.ts` byte hash matches the artifact source, and the generated Windows shim passes `-v`, `--version`, help, and credential-free docs smoke checks. The documented exact `0.5.1` tarball from commit `f4d756cd634898804850cfc20596b7f145ef7515` (SHA-256 `ee8671d777865cf1d9ff8de1d21c84d8e08dff70ca49602b0a172b4d90ebee66`) is the rollback artifact; registry publication remains unapproved.
- `[VERIFIED]` Changesets generated the private `0.4.1` reliability release. It preflights every exact final Trello description against the documented 16,384-character limit with structured no-write size evidence, writes bounded versioned SHA-256 operation records while retaining exact legacy replay, reports transition dry-runs through the executable, accepts and removes only explicitly resolved Open Questions on Ready transition, and ships aligned recovery guidance in all four managed skills. The release passes 274 package tests, strict publint, repository and workflow gates, credential-free live-harness boundaries, exact-SHA CI, clean-consumer installation, generated-shim help/docs, installed compact-record/preflight smoke, and byte-exact managed-skill installation. Greek Essence and live Trello state were not accessed.
- `[VERIFIED]` `jz-trello-flow get` always reports `attachmentCount` and complete normalized attachment metadata. Explicit `--attachments-dir <directory>` downloads uploaded files with authenticated binary-safe transport, lexical destination containment, deterministic duplicate naming, atomic no-overwrite creation, metadata-only external links, and truthful partial-failure recovery. JSON/text output, offline docs, packed contents, and 251 passing package tests cover the additive contract; independent review found no Critical, High, or Medium issue.
- `[VERIFIED]` `packages/trello-work-cli/assets/agent-workflow-protocol.md` is the accepted package-owned protocol source for Trello-backed development through Claude Code, Codex, Pi, and Hermes Agent. Trello/`jz-trello-flow` owns durable lifecycle state while Superpowers or equivalent harness practice owns software design and implementation. Four canonical open-standard sources implement that contract at `.agents/skills/trello-work-{orchestrator,design,deliver,recover}/SKILL.md`; all pass official `skills-ref` validation pinned to upstream commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`, and fresh re-review found no Critical, High, or Medium issue. `packages/trello-work-cli/assets/agent-skills-adapters.md` defines downstream client adaptation without semantic forks.
- `[VERIFIED]` `jz-trello-flow skills install` is a self-contained offline, credential-free command that discovers the containing Git repository from nested paths, ignores inherited `GIT_*` repository selectors, and installs only the four skills bundled with the executing package under `.agents/skills/`. Runtime staging validates the complete transformed structure without Python, an external checkout, network, Trello configuration, or Trello access. Official pinned `skills-ref` validation is a root development/release command against the exact transformed source or unpacked artifact payload. Transactional replacement, rollback, restoration-failure recovery retention, redirected-path containment, no-write dry-run, unrelated-skill preservation, exact inventory, and repeat identity remain verified.
- [VERIFIED] eatures-cli provides offline, read-only built-in workflow documentation through docs, docs --index, exact canonical/numeric topic lookup, and docs current. The typed docs model has exhaustive frontier guidance, preserves the unchanged progress --json object, exposes structured docs JSON errors, and makes current PRD-authoring and feature-review ownership gaps explicit. The 11-file packed artifact passes strict publint and clean-consumer docs invocation; full regression passes 154 tests.
- `[VERIFIED]` The 2026-07-29 standing-autonomy directive applies to routine bounded work: agents proceed through review, commit, and push without a separate permission stop. Workflow v2 records direct approval only for dangerous deletion or irreversible data loss and still requires fresh execution-time confirmation; unavailable hard prerequisites still escalate.
- `[HISTORICAL EVIDENCE]` `packages/weekly-report-cli` version `0.1.0` established the private, non-published Node.js 24 process-only package and its eight-file packed boundary. Its recorded 30-test, strict-publint, clean-consumer, exact-SHA CI, tarball-checksum, and global-install evidence remains immutable, but later independent review found credential-disclosure and evidence-integrity defects, so `0.1.0` is not accepted for credential-bearing input.
- `[VERIFIED]` Corrective work item `2026-07-31-recover-git-evidence-collector` delivered private patch `0.1.1` through merged PR `#20` at default-branch commit `0f6dee6abc3e689ffb7e743649451335a00b288b`. Four joined review cycles have no required finding; exact final PR head `8798b27df4fcee8cc4392782eec73f0f12069c6b` passed Quality and Windows/Linux Portability CI. Exact eight-file tarball SHA-256 `60adadd364debf8dfe77b14a6634d70fbe203f8cfe356a11823fefecaaf505f7` byte-matches global `0.1.1` and passes clean-consumer plus generated-shim smoke. Default-branch package bytes match the reviewed artifact-bearing commit, and Trello WU-30 is read-back-confirmed Done.

## 4.2 Product context supplied by the user

- `[USER-LOCKED]` The existing CLI is written in TypeScript and uses Bun.
- `[VERIFIED]` Its former junction at `C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system\scripts\features-cli` is retired; the private package and packed artifacts are the active distribution and rollback routes.
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
- `[USER-LOCKED]` Bun remains the runtime for the existing `features-cli` and `trello-work-cli`; the approved weekly-report CLI uses a deliberate Node.js 24 distribution.
- `[USER-LOCKED]` Package naming prefix: `@jz/ai-arsenal-`.
- `[USER-LOCKED]` CLI packages follow the approved `@jz/ai-arsenal-<name>` convention; current CLIs are `features-cli`, `trello-work-cli`, and `weekly-report-cli`.
- `[VERIFIED]` `@jz` registry ownership is not required for the private, non-published initial package.
- `[VERIFIED]` Registry publication is not needed in the initial release; the package remains private.

## 4.4 Quality and release direction

- `[USER-LOCKED]` Prefer low-complexity, high-impact tooling.
- `[USER-LOCKED]` Include ESLint and Prettier unless existing equivalent tooling is intentionally retained.
- `[USER-LOCKED]` Include Husky and lint-staged for fast local feedback.
- `[USER-LOCKED]` Use Conventional Commits and commitlint.
- `[USER-LOCKED]` Use Changesets for package versions and changelogs.
- `[USER-LOCKED]` For every user-declared release, including a private locally distributed tarball, choose a SemVer bump with Changesets and run `pnpm version-packages` to produce the package version and changelog. For an in-scope CLI behavior change whose bounded work item includes the complete release chain, preflight, rollback, and verification, global pnpm replacement is a routine recoverable delivery operation: proceed with `Approval: not-required` only after the exact reviewed artifact-bearing commit is pushed and its required CI succeeds. Dangerous deletion or irreversible data loss still requires fresh confirmation; registry publication, source deletion, destructive Git operations, and unrelated external mutations require separate authority.
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
- The legacy source junction was retired after parity, packaged-artifact rollback verification, and explicit user approval.

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

For `features-cli` and `trello-work-cli`, owns:

- Runtime execution.
- The `#!/usr/bin/env bun` executable contract.

The CLI currently uses Node-compatible APIs rather than `Bun.*`. Do not add bundling or replace Jest merely because Bun provides those capabilities.

### Node.js

For `weekly-report-cli`, owns:

- The Node.js 24 runtime contract.
- The compiled `dist/bin.js` executable boundary.

The package is built with TypeScript before packing. It does not change the Bun runtime contract of either existing CLI.

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
│   ├── features-cli/
│   │   └── package.json
│   ├── trello-work-cli/
│   │   ├── assets/
│   │   │   └── agent-skills/
│   │   ├── src/
│   │   ├── test/
│   │   └── package.json
│   └── weekly-report-cli/
│       ├── src/
│       ├── test/
│       ├── package.json
│       └── README.md
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
- A root TypeScript config remains simpler than a config package while no repeated configuration boundary requires one.

## 7.4 Package naming

Valid npm scope structure:

```text
@scope/package-name
```

Approved AI Arsenal convention:

```text
@jz/ai-arsenal-<name>
```

Current CLI package names:

```text
@jz/ai-arsenal-features-cli
@jz/ai-arsenal-trello-work-cli
@jz/ai-arsenal-weekly-report-cli
```

Folder names may remain short:

```text
packages/features-cli
packages/trello-work-cli
packages/weekly-report-cli
```

The verified executable names are `features-cli`, `jz-trello-flow`, and `weekly-report-cli`. Preserve them.

All three CLI packages are private and expose no TypeScript import API.

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

Package-local Jest transformers use the pinned TypeScript compiler and produce `coverage/` as a declared Turbo output. The two Bun packages preserve Bun-compatible source execution; `weekly-report-cli` uses NodeNext resolution and emits a compiled `dist/` executable before packing. The migrated `features-cli` package retains one narrow lint exception for the characterized fail-closed throw inside `finally`.

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

The Trello Work Unit CLI has 277 passing offline tests plus 2 opt-in live cases across 22 suites with no runtime validator prerequisite. They cover schema and parser strictness, mixed Inbox classification, explicit board resolution, seven-list defaults and overrides, open-only active canonical resolution, archived-only guarded initialization, pre-handler rejection of archived configured targets, list CRUD, dry-run and request construction, executable command routing, in-place design promotion, Ready completeness gating, version preflight, board-wide operation-ID replay/collision ordering, retained-marker postcondition drift, partial recovery, checklist mutations, redaction, API error mapping, attachment metadata/download safety, docs, package boundaries, self-contained managed skill installation, adversarial Git/Python environment isolation, and actual packed-consumer invocation. Official pinned validation runs separately against the exact transformed release payload. Its gated live harness passed all 14 checks on the allowlisted TestingBoard, including both intake paths, same-card identity, transition completion, and run-owned cleanup.

Preserve Jest initially because the existing 109-test suite uses Jest-specific spies, fake timers, and module access. Use Node subprocess APIs in tests to invoke the real Bun executable; do not couple tests to `Bun.spawn` unless production needs it.

## 7.7 Package and distribution contract

- Package: `@jz/ai-arsenal-features-cli`.
- Folder: `packages/features-cli`.
- Executable: `features-cli`.
- Runtime: Bun `1.3.14` initially, deliberately pinned at the repository level.
- Artifact: npm-compatible source package containing TypeScript executed by Bun.
- Runtime dependencies: none unless migration evidence proves otherwise.
- Registry: private package; no npm publication or publication automation.
- Packed boundary: package metadata, README, and the nine production TypeScript modules only.
- Validation: strict publint packs with pnpm; Are the Types Wrong remains inapplicable because there is no import surface.
- Verified consumption: install the tarball into a clean unrelated pnpm consumer and run `features-cli` through the generated Bun-aware command shim. The current artifact is also installed globally on the Windows consumer machine; the stable executable passes read-only smoke checks in the two worktrees that mount the shared `.scratch` state.
- The legacy source junction is retired; prior verified packed private artifacts provide rollback.

### Weekly-report CLI

- Package: `@jz/ai-arsenal-weekly-report-cli`.
- Folder: `packages/weekly-report-cli`.
- Executable: `weekly-report-cli`.
- Runtime: Node.js 24 with compiled JavaScript in `dist/`.
- Import API: none; the process boundary owns stdout, stderr, and exit codes.
- Registry: private package with no registry publication.
- Packed boundary: `README.md`, `package.json`, `dist/arguments.js`, `dist/bin.js`, `dist/cli.js`, `dist/evidence-schema.js`, `dist/git-collector.js`, and `dist/redaction.js` only.
- Current behavior: honest help/version and usage diagnostics plus deterministic `collect git` evidence for an explicit working tree, remote, default branch, and inclusive interval.
- Consumer boundary: runtime target configuration and machine-readable evidence cross the process boundary; consumer identity, credentials, report interpretation, scheduling, and delivery remain outside this package.
- Validation: historical `0.1.0` evidence remains immutable but that release is defective. Delivered `0.1.1` behavior and its portable test-only fixture repair pass 79 package tests, strict publint, clean packed-consumer execution, full repository gates, workflow validators, privacy inspection, four joined review cycles, exact-commit Quality and Windows/Linux Portability CI, exact eight-file tarball proof, clean-consumer smoke, byte-exact global installation, generated-shim smoke, merged default-branch equality, and guarded Trello closure.

## 7.8 Behavioral and persistence contract

- The invocation `cwd` is the project root; do not add upward root discovery during migration.
- Preserve command names, flags, human output meaning, JSON shape, and `0/1` exit behavior.
- `--feature <selector>` accepts an exact slug, a plain or zero-padded positive ID, or a full `ID-slug` feature directory name. Exact slugs take precedence; a full selector must match both the registered ID and slug.
- Preserve feature state schema version `"2"`, canonical issue Markdown, derived `issues-status.json`, milestone fences, and contract-file derivation.
- Preserve exact-byte behavior for user-authored Markdown outside intended metadata edits.
- Preserve one-writer fail-fast locking for the migration release.
- Treat incomplete atomicity and stale locks as explicit hardening work, not silent migration refactors.

## 7.9 Trello-backed agent workflow boundary

- Trello and `jz-trello-flow` are authoritative for durable Work Unit identity, status, assignment metadata, transition validation, operation identity, read-back, and recovery.
- Superpowers owns engineering practice such as brainstorming, planning, TDD, debugging, implementation execution, review, and verification; Trello skills coordinate state and concise evidence without reimplementing that methodology.
- Claiming is a guarded owner-update plus `Ready → In Progress` sequence whose owner and status must both be read back. It is not an atomic Trello lock.
- Work Unit sections keep concise evidence summaries and repository links; detailed artifacts remain authoritative in the repository, Git, and CI.
- Agents may complete `Review → Done` using judgment only after acceptance criteria, applicable verification, blocker absence, and concise evidence are satisfied. Humans alone own final Done-card review and manual archival.
- Harness adapters may vary installation and bootstrap mechanics but must preserve one portable lifecycle core. Current Superpowers upstream documentation does not establish native Hermes Agent support.
- The package ships a version-matched copy of the four canonical skills and their protocol authority for `jz-trello-flow skills install`; generated managed markers and the one local protocol-link rewrite distinguish installed payloads without creating a semantic fork.
- Skill installation is offline and must complete repository discovery, full payload preparation, and official pinned validation before replacing any managed target. It never loads Trello configuration or credentials and never modifies unrelated skill directories.

---

# 8. Monorepo Work-Item Pipeline and Legacy Plan Maintenance

Normal monorepo changes use the read-only `orchestrate-monorepo-work` router
and the artifact-driven pipeline defined in
`docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`. This workflow is separate from
consumer `.scratch/features/` work and never uses `features-cli` for monorepo
self-hosting.

## 8.1 Normal routing and durable evidence

Every new Workflow v2 item uses the deterministic
`work/<work-item-id>` branch in the sibling worktree
`<repository-parent>/<repository-name>.worktrees/<work-item-id>`. Definition
requires a clean non-`work/*` base checkout and preflights branch/path
collisions and redirection before provisioning that worktree. It creates the
compact item and its active `NEXT.md` route only there, leaving the base clean
with `none` / `none`. Active validation fails closed from the base, another,
missing, redirected, or detached worktree and from a mismatched branch.
Independent worktrees retain independent routes and review candidates. Delivery
pushes but does not merge, delete, prune, or remove anything; an external
integrator resolves shared planning-file changes when sequentially merging
already-delivered branches. Worktree removal remains dangerous deletion.
Delivered historical records and existing pre-policy worktrees remain readable
without retroactive metadata changes.

The router selects the stage from one validated compact work item:

```text
define → implement → review/repair → verify → deliver
```

Each v2 item uses one `work-item.md` containing its goal, non-goals, acceptance
criteria, time estimate/start, implementation summary, review and repair record,
and final verification. The router does not write files or change Git state.
Historical v1 artifact directories remain readable through the validator's
compatibility path; new work never creates that artifact chain.

New compact v2 items model review explicitly with `Review status` values
`pending`, `failed`, or `passed` and a `Review snapshot` that is either
`pending` or a concrete lowercase SHA-256 value. Definition and entry into
review start pending; unsuccessful review records failed; complete required
review evidence records passed; and candidate-changing repair resets review to
pending before re-review. The four-cycle limit remains unchanged. Delivered
compact records using the retired `Required findings remaining: no` field stay
readable without rewriting their historical bytes.

Workflow v2 now has one reusable deterministic review-candidate calculation at
`scripts/calculate-review-snapshot.mjs`. It binds tracked changes from `HEAD`
and non-ignored additions through normalized repository-relative paths,
ordinal ordering, collision-safe length framing, baseline/current raw bytes,
file modes/types, explicit deletion entries, and rename-as-delete-plus-add
semantics. `NEXT.md` is excluded as routing-only state. The active compact work
item remains included after narrowly removing only stage/status/timing/review
control fields and review, verification, and delivery evidence; its identity,
safety classification, goal, non-goals, acceptance criteria, and implementation
description remain reviewed input. The callable API and command return only a
`sha256:<64 lowercase hexadecimal characters>` digest.

Workflow v2 review uses one runtime-neutral batch-evidence contract. Before
dispatch it records a concrete candidate snapshot, non-pending batch identity,
and unique deterministic reviewer roles; every received result carries its
reviewer, outcome, batch, and snapshot. One reusable reconciliation function
canonicalizes immediate or later-arriving results identically. Incomplete or
structurally mismatched evidence remains pending, a complete matching batch
with any unsuccessful required result is failed, and passed requires exactly
one matching successful result per expected role with no invalid extras.
Candidate-changing repair resets all review evidence before a fresh snapshot
and batch. The three review-evidence fields are excluded by the shared snapshot
calculation as mutable control state, and a concrete pending snapshot is valid
only while the item remains in review.

Validator advancement and freshness enforcement issue `#18` is delivered. The
validator rejects pending, failed, incomplete, malformed, mismatched, or stale
review evidence at verify and active delivery, and requires newly delivered
records to retain complete evidence with no later candidate dirt. An exact
reviewed artifact commit can validate in a clean checkout by reconstructing the
same candidate from `HEAD^` to `HEAD` only when the ordinary candidate is clean.
That commit source uses the shared framing/filter/hash path and preserves real
gitlink addition, pointer-update, and deletion semantics. All three Git
discovery/cleanliness seams force `--ignore-submodules=none`, so local or
committed ignore configuration cannot hide tracked or untracked submodule
state. Quality CI fetches two commits to make the parent available. Exact
immutable hashes preserve the eleven delivered pre-batch records without
granting broad compatibility to newly fabricated records.

Integration and documentation issue `#19` is delivered. Its disposable-
repository matrix proves the complete barrier across unperformed, pending,
failed, incomplete, mismatched, stale, unchanged, repaired, delivery-bypass,
immediate/later-arriving batch, and immutable-history cases. Root guidance,
the compact template, review skill, normative pipeline, and living-workflow
assertions share the same five field names, snapshot source, pending
initialization, complete-evidence rule, repair reset, fail-closed advancement,
and exact-hash historical boundary. The exhausted four-cycle predecessor
remains blocked as audit evidence; the user's one-attempt successor passed
contract and quality review, final verification, and exact-SHA CI before
delivery.

Parent issue `#14` is closed after all required child issues `#15` through
`#19` completed. Its current closure is supported by the delivered child work
items and live GitHub issue readback; no parent-specific product or CLI change
was required.

Issue `#13` routine global CLI replacement authority and issue `#12`
fail-closed CLI delivery evidence are delivered. Current v2 items declare
whether CLI local-delivery evidence is required; required evidence remains
active until artifact, remote, CI, package, tarball, installation, smoke,
provenance, rollback, and clean-worktree results are complete and consistent.
Ordinary non-CLI items remain exempt. Active items are developed only in their
matching isolated `work/<work-item-id>` worktree, and delivery does not merge,
delete, prune, or remove that branch/worktree.

## 8.2 Reconciliation and current truth

Only `deliver-monorepo-change` closes a normal active work item. It requires an
explicit `Result: passed` in final verification and no required review
findings, updates the compact record, canonical plan, and `NEXT.md` from
verified reality, reruns only checks invalidated by those delivery edits,
clears active registration, and validates the completed state.

The canonical plan must remain current coherent truth. Preserve historical
rationale in evidence, ADRs, or Git history rather than plan-diff prose.
Repeated reconciliation with no new evidence must not create wording churn.

## 8.3 Structural repair and legacy use

Malformed work-item metadata or invalid active registration routes to
`initializing-living-plan-workflow`. That
repair path preserves artifacts, does not infer user intent or approval, and
returns to the router after validation.

`executing-living-plan-phase` and `reconciling-living-plan` remain only as
compatibility paths for legacy instructions and verified legacy-plan repair.
They must redirect normal active work items to the router and its selected
stage.

## 8.4 Autonomy and escalation

The pipeline is fully autonomous for bounded work. Routine work has no approval
artifact. Dangerous deletion or similarly irreversible data loss awaiting
direct user approval and an unavailable hard prerequisite are intentional
valid blocked states, not structural corruption. Recorded approval still
requires fresh direct confirmation immediately before the exact destructive
operation. Never replace required live/E2E evidence with mocks merely to avoid
escalation. Routine planning, revisions, implementation, review repairs,
commit, and push do not create permission stops. Definition records a maximum
estimate and start time. At the start of every agent turn that creates or
resumes the item in any of the five stages, increment the durable turn counter
once; when it reaches five, record the proportionality check, update the
timestamp, and reset to zero. The validator checks only recorded state and
cannot observe omitted conversational turns. Review consolidates findings,
permits at most four repair/re-review cycles, fixes Critical/High/Medium and
acceptance-related Minor findings, and excludes optional polish. Full gates run
once on the stable final snapshot and only invalidated checks rerun after
repair or delivery edits.

---

# 9. Phase Map

| Phase | Name                                                     | Current status | Main output                                          | Approval gate    |
| ----- | -------------------------------------------------------- | -------------- | ---------------------------------------------------- | ---------------- |
| 0     | Workflow Bootstrap and Repository Orientation            | **Complete**   | Valid workflow state and organized inputs            | Satisfied        |
| 1     | CLI Discovery, Workflow Observation, and Plan Grounding  | **Complete**   | Evidence-grounded canonical plan                     | Satisfied        |
| 2     | Monorepo Foundation and Developer Workflow               | **Complete**   | pnpm/Turbo root and quality workflow                 | Satisfied        |
| 3     | CLI Characterization and Migration Boundary              | **Complete**   | Behavior baseline and migrated package boundary      | Satisfied        |
| 4     | Build, Packaging, and Distribution                       | **Complete**   | Verified distribution artifact                       | Satisfied        |
| 5     | Domain and Filesystem Test Foundation                    | **Complete**   | Unit/integration confidence and data-safety contract | Satisfied        |
| 6     | CLI E2E and Distribution Testing                         | **Complete**   | Real process and clean-consumer confidence           | Satisfied        |
| 7     | CI, Portability, Consumer Cutover, and Source Retirement | **Complete**   | Verified CI, consumer cutover, and retired junction  | Satisfied        |
| 8     | Final Validation and Operating Documentation             | **Complete**   | Release-ready verified repository                    | Final acceptance |
| M1    | Flexible Feature Selector Compatibility                  | **Merged**     | Compatible public `--feature` selection              | CI confirmation  |
| M2    | Monorepo Work-Item Pipeline                              | **Complete**   | Verified compact Tier 2 maintenance workflow         | Satisfied        |
| M3    | Trello Agent Development Workflow Protocol               | **Complete**   | Verified package-owned cross-harness protocol        | Satisfied        |
| M4    | Open-Standard Trello Agent Skills                        | **Complete**   | Four verified canonical Agent Skills + adapter guide | Satisfied        |
| M5    | Autonomous Work-Item Governance                          | **Complete**   | Five-stage autonomy + narrow escalation-only stops   | Satisfied        |

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
- Preserve the packaged-artifact rollback route; do not recreate the retired source junction.
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
- The historical source inventory remains unchanged; the legacy source junction is retired.

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
- `archives/v1/` is absent from the package; the historical source inventory remains evidence and packed private artifacts remain the rollback route.
- Production imports have no source-checkout dependency. The legacy secondary-entrypoint usage string remains frozen public output, not a runtime path dependency.

## Ongoing invariants

- Preserve commands, output meaning, exit behavior, parser behavior, lifecycle rules, schema version `"2"`, canonical Markdown, derived JSON, exact user-authored bytes, fail-fast locking, recovery behavior, and strict invocation-`cwd` semantics.
- Keep the packaged-artifact rollback route available after source-junction retirement.
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
- Preserve the historical source inventory and packaged rollback artifacts; do not recreate the retired source junction.

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
- Phase 7 verifies Windows/Linux CI and consumer cutover. The legacy source junction is retired; preserve the packaged-artifact rollback route.

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
- The current packed artifact is installed globally through pnpm, exposing the stable `features-cli` command. The primary `ics-vcr` checkout and the `remote-logging-system` worktree pass read-only stable-command smoke checks against their shared `.scratch` state after the legacy junction retirement.
- The Spec-to-Ship workflow documentation and the five personal `jz-*` consumers use the stable executable; no personal consumer retains a direct `scripts/features-cli` or `npx tsx` invocation. The three other registered `ics-vcr` worktrees have no `.scratch` or source-CLI junction, so they are not CLI consumers.
- `docs/operations/features-cli-cutover.md` records global installation, read-only smoke verification, and packaged-artifact rollback. The historical 14-file inventory remains migration evidence.

Windows is required. Linux is the portability target. macOS is out of scope until a consumer requires it.

## Source retirement

The user-authorized dangling `scripts/features-cli` junction has been removed
after behavior parity, consumer cutover, CI, and packaged-artifact rollback
were verified. Do not recreate a legacy source rollback junction.

## Reconciliation gate

Complete. The legacy source junction is retired; packaged artifacts remain the
rollback route.

---

# 18. Phase 8 — Final Validation and Operating Documentation

## Resulting verified state

- Complete local and clean-checkout verification passes with the pinned Node, pnpm, and Bun toolchain.
- Clean-checkout validation on Windows exposed and fixed the missing repository line-ending policy. `.gitattributes` now keeps tracked text files on LF, and ADR `docs/decisions/0001-line-ending-policy.md` records the rationale.
- The actual packed source artifact installs into an unrelated temporary consumer, exposes the `features-cli` command, completes a disposable schema-v2 feature lifecycle, and retains the exact 10-file package boundary.
- Hook and release workflow checks pass: lint-staged, commitlint, and Changesets status.
- `pnpm-lock.yaml` remains the only repository lockfile, and no unabsorbed input plans are pending.
- Retired source-path references are limited to provenance and historical migration evidence; rollback documentation uses packed artifacts.
- Root and package documentation describe installation, architecture, development commands, package validation, consumer invocation, Changesets usage, private release policy, constraints, and approval gates.
- Latest public Quality and Portability workflow runs pass on `master`.

## Final acceptance

The user accepted the completed migration and operating documentation on 2026-07-12, then approved and completed retirement of the dangling legacy source junction.

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

### Resulting verified state

- Workflow v2 uses define → implement → review/repair → verify → deliver and one compact `work-item.md` per current item.
- The Tier 2 policy targets one to six trusted users, requires five-turn proportionality checks, caps repair/re-review at four cycles, and runs full gates once on the stable snapshot.
- Routine work has no approval artifact. Dangerous deletion or irreversible data loss retains direct approval and fresh execution-time confirmation; unavailable hard prerequisites block honestly.
- The validator routes compact v2 items and retains a read-only v1 compatibility path so historical work-item evidence remains readable without migration machinery.
- Compact v2 review is explicit: new items begin pending, unsuccessful review is failed, successful review is passed for a concrete snapshot, candidate-changing repairs reset to pending, and the four-cycle stop remains enforced. Delivered compact records using the retired implicit field remain readable without rewriting.
- The pipeline remains separate from consumer `.scratch/features/` workflows.

### Approval gate

Routine bounded implementation, review, verification, delivery, commit, and push are autonomous. A complete in-scope CLI delivery may replace the global package after exact artifact CI succeeds without a separate prompt; publication, source deletion, destructive Git operations, and unrelated external mutations remain separately authorized, and dangerous deletion requires direct approval.

---

## Maintenance update — Trello Intake and In Design Lifecycle

### Resulting verified state

- Inbox accepts ordinary Trello intake cards and canonical Draft Work Units without conflating the two; malformed cards claiming Work Unit identity remain explicit validation failures.
- `jz-trello-flow draft create` creates structured Inbox drafts, `jz-trello-flow create` is a deprecated compatibility alias, and `jz-trello-flow design start` converts the selected card in place so card identity and Trello history are preserved.
- `In Design` is the seventh canonical list and `in_design` is the resumable partial status. Canonical structure is retained while explicit `Pending:` content and Open Questions are allowed; Ready requires both to be resolved.
- Metadata dry-run outcomes, real command routing, cross-card operation-ID collision safety, stale-version handling, replay/recovery, docs, fixtures, and the revised onboarding workbook are verified offline.
- All 230 package tests, package/root quality gates, 30 workflow tests, strict package validation, affected-path audit, and independent review pass. No `.tgz`, credential artifact, global installation, live Trello mutation, or Git-history mutation occurred during repository verification.

### Resulting operation state

Commit `2e33014cecfd481993a799e1b7b4b7bb674d2d68` is present on `master` and `origin/master`; Quality run `30400791878` and Portability run `30400791849` passed for that exact SHA. The exact private `0.2.0` package is globally registered, its native Windows `jz-trello-flow --help` succeeds without credentials, and the separately authorized onboarding workbook passed all 14 checks only on TestingBoard `6a16bbf1fea5389eb39636b7`. Publication and production-board access remain unapproved.

---

## Maintenance update — Trello Agent Development Workflow Protocol

### Resulting verified state

- The package-owned protocol defines the full Work Unit lifecycle from Inbox intake through human archival after Done, including minimum transition preconditions, read-back, evidence, blocking, review, completion, and recovery semantics.
- Durable task state belongs to Trello/`jz-trello-flow`; Superpowers or equivalent harness practice owns software-design and implementation methodology.
- Normal ceremony is intentionally light. Strictness is limited to safety-critical board selection, latest reads, version guards, durable operation identity, postcondition verification, and exceptional recovery.
- The proposed follow-on skill set is exactly `trello-work-orchestrator`, `trello-work-design`, `trello-work-deliver`, and `trello-work-recover`, with a verification matrix for Claude Code, Codex, Pi, and Hermes Agent.
- The protocol source is not included in `package.json`, packed artifacts, or `jz-trello-flow docs`. No skill, release, installation, production Trello mutation, Git Bash repair, or automatic archival was implemented.

### Approval gate

Protocol design, documentation, and the four open-standard skills were digest-authorized and independently verified. Package/docs integration, release, installation, and production-board migration remain separate bounded work items, not routine permission prompts.

---

## Maintenance update — Open-Standard Trello Agent Skills and CLI Installation

### Resulting verified state

- Exactly four canonical project-level Agent Skills implement the accepted protocol: read-only orchestration, intake/design through Ready, normal delivery from Ready through Done, and exceptional recovery.
- The sources follow the Agent Skills open specification and cross-client `.agents/skills/` convention. Official `skills-ref` validation at upstream commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e` passes for every directory.
- Draft creation explicitly reads back Inbox and then preserves the same card through `design start` to In Design. Claiming remains recovery-aware and non-atomic; engineering starts only after owner and In Progress are both read back.
- `packages/trello-work-cli/assets/agent-skills-adapters.md` permits mechanical client integration differences while prohibiting lifecycle, mutation-safety, completion, recovery, and archival semantic changes.
- Fresh re-review of current sources found no unresolved Critical, High, or Medium issue.
- `jz-trello-flow skills install` ships version-matched package copies of the four skills and their protocol authority, marks them as CLI-managed, and installs them under the selected repository's `.agents/skills/` directory.
- Nested Git-root discovery is contained and ignores inherited repository selectors. Complete self-contained structural validation of the package-bundled transformed payload precedes four-target replacement; later swap failure rolls prior replacements back. Unrelated skills are preserved, and `--dry-run` reports the same installed/replaced plan without target mutation.
- Official pinned `skills-ref` validation is a development/release gate against the exact transformed payload, not an end-user runtime dependency. Version `0.5.1` passes focused, package, official-validator, packed-consumer, root, workflow, exact-SHA CI, global-install, installed-byte, and repeat/sentinel gates without registry publication.
- Version `0.5.1` includes every matching visible/open ordinary card and Work Unit in member-filtered listings, excludes archived cards at the transport boundary, preserves owner as a separate execution-claim filter, and keeps metadata filters Work Unit-specific. It passes 281 package tests, strict publint, official pinned skill validation, root/workflow gates, credential-free live safety checks, a 32-file clean consumer, privacy/diff checks, exact-SHA CI, byte-proven global installation, and read-only installed-shim TestingBoard smoke.

### Delivery boundary

The protocol, canonical skill sources, package payload, self-contained offline installer command, help, offline documentation, private `0.5.1` release, and global installation are complete and verified. Generated client adapters, automatic client bootstrap beyond repository-local `.agents/skills/` installation, registry publication, and production-board migration remain separate bounded work items.

---

# 19. Current Risks

| Risk                                                                                                               | Current status                      | Required resolution                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Legacy source junction is mistakenly recreated                                                                     | Controlled                          | The junction is retired; retain only packaged-artifact rollback and do not recreate the source path                              |
| Direct issue mutations can leave issue Markdown ahead of derived JSON and feature timestamps after a write failure | Characterized open risk             | Real-process boundary is verified; broaden transaction hardening through a bounded evidenced work item                           |
| Stale locks require manual recovery                                                                                | Accepted, test-backed constraint    | Preserve fail-fast behavior; automate only through a bounded evidenced work item                                                 |
| Skills depend on paths, output, and schemas                                                                        | Controlled for cut-over consumers   | Stable-command instructions and two read-only worktree smoke checks are verified; preserve packaged-artifact rollback            |
| Wrong `cwd` targets the wrong `.scratch`                                                                           | Controlled by E2E                   | Preserve documented root invocation; no upward discovery                                                                         |
| Windows junction/path behavior may regress                                                                         | Controlled by CI and smoke checks   | Preserve the stable `cwd` contract and packaged-artifact rollback route                                                          |
| Linux portability regression                                                                                       | Resolved by CI                      | Keep the public Ubuntu matrix as the portability regression gate                                                                 |
| Windows line-ending drift may break formatting or byte-sensitive fixtures                                          | Controlled                          | Preserve `.gitattributes` LF policy                                                                                              |
| User-authored Markdown may be damaged by hardening                                                                 | Controlled by tests                 | Preserve byte-level milestone tests and extend before any broader mutation hardening                                             |
| Separate plans could drift                                                                                         | Controlled                          | Single canonical plan                                                                                                            |
| Human forgets workflow state                                                                                       | Controlled by design                | `NEXT.md` and session contract                                                                                                   |
| Agent skips reconciliation                                                                                         | Controlled by workflow              | Required skills and gates                                                                                                        |
| Live Trello behavior outside the dedicated TestingBoard is not verified or authorized                              | Explicitly bounded                  | Keep live mutation allowlisted to TestingBoard unless a separate approved work item authorizes another board                     |
| Atomic production Work Unit ID allocation has no selected Trello-backed concurrency mechanism                      | Explicitly deferred                 | Select and verify a backing mechanism before representing allocation as production-concurrency-safe                              |
| Git Bash cannot currently resolve the generated global pnpm shim for `jz-trello-flow`                              | Open compatibility question         | Decide in a separate bounded change whether Git Bash invocation is a supported requirement; native Windows invocation passes     |
| Attachment download containment is lexical and does not reject destination symlink/junction components             | Accepted Tier-2 residual risk       | Treat the explicitly supplied destination as trusted local configuration; harden separately if hostile local links are in scope  |
| A destination appearing after attachment preflight can waste download work before atomic `wx` creation rejects it  | Accepted Tier-2 residual risk       | Preserve atomic no-overwrite behavior; add a dedicated race regression only if this local race becomes a supported threat seam   |
| Trello claim sequencing cannot atomically update owner and status                                                  | Explicitly bounded                  | Preserve recovery-aware multi-step claiming; design a stronger allocation backend before claiming atomic production ownership    |
| Superpowers does not currently document native Hermes Agent support                                                | Explicitly bounded                  | Use equivalent Hermes engineering-practice skills and never claim native Superpowers execution without evidence                  |
| The production Greek Essence board does not match the canonical seven-list lifecycle                               | Separate migration boundary         | Initialize or migrate it only through a dedicated bounded migration work item with guarded verification                          |
| CLI-managed skill directories intentionally replace local edits on every install                                   | Accepted product behavior           | Preserve managed markers, explicit action reporting, unrelated-skill isolation, and documentation of replacement semantics       |
| Official release validation depends on pinned `skills-ref` source and an isolated Python runtime                   | Controlled development prerequisite | Preserve exact provenance and UTF-8 execution for development/release evidence; never restore it as a runtime install dependency |
| No generated client adapter or automatic harness bootstrap has been produced                                       | Explicit distribution boundary      | Derive adapters or broader bootstrap only through separately bounded client work                                                 |

Reconciliation must remove resolved risks and add newly material risks.

---

# 20. Current Open Decisions

Phase 8 final validation is complete and accepted. The user-authorized dangling legacy source junction has been retired; the packaged-artifact rollback route remains documented.

Broad transaction hardening for issue Markdown, derived issue state, and feature registry timestamp coupling remains a separate bounded work item. Phase 6 confirms the existing partial-write boundary without showing a distribution or process failure that requires it now.

Public behavior/schema, material tooling, and distribution changes require bounded contract/verification artifacts but proceed autonomously. No legacy source-junction deletion remains pending.

The dedicated TestingBoard identifier, process-environment credential source, and recovery-aware procedure are verified. Archived-list canonical resolution passed offline review, exact-SHA CI, exact-package installation, and revised seven-list dual-intake live validation on TestingBoard. Production-board use, migration of the noncanonical Greek Essence board, and a production atomic allocation backend remain separate bounded work items; dedicated-board validation does not prove a Trello-backed concurrency mechanism. Git Bash global-shim compatibility is likewise a separate compatibility work item because native Windows invocation passes while Git Bash path resolution does not.

The package-owned protocol, four canonical open-standard Agent Skills, version-matched packed payload, self-contained repository-local installer, and all-visible/open-card member/owner read contract are accepted and delivered in globally installed private version `0.5.1`. Generated client-specific adapters, automatic harness bootstrap beyond `.agents/skills/`, registry publication, and production Trello use remain separate bounded work items.

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

The active `2026-08-01-retire-source-cli` work item is reconciling and
verifying the completed legacy junction retirement. Packaged private artifacts
remain the rollback route; the next bounded request follows delivery.
