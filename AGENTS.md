# AI Arsenal Agent Operating Guide

## User Profile Rules

- When presenting multiple items, always format them as a bulleted or numbered list.
- Always finish responses with a clearly labeled next recommended action.

## Confirmed Project Root

- The intended AI Arsenal monorepo root is `C:\Users\jimzord12\Documents\GitHub\ai-arsenal`.
- Do not treat a nested `features-cli` directory as the repository root.

<!-- living-plan-workflow:start -->

## 30-Second Resume Contract

At the beginning of every Codex session:

1. Read `NEXT.md`.
2. Read the sections of `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` referenced by `NEXT.md`.
3. Inspect `git status --short` and the latest relevant commits when a Git repository exists.
4. Check whether the required phase approval, prerequisites, and verification evidence exist.
5. Do not begin work from memory or from an older plan.

When the user asks **“What is going on?”**, **“Where are we?”**, or anything equivalent, answer in this exact compact shape:

```text
Project:
Current state:
Next action:
Requirements/blockers:
Why this is next:
Approval needed:
```

The answer must be understandable in approximately 30 seconds. Do not give a wall of text unless the user asks for detail.

## Current Project State

This repository is currently an **implemented public monorepo with Phase 8 final validation accepted and maintenance/release handoff pending**.

Known:

- The project goal is to create the `AI Arsenal` monorepo for the user’s AI-driven development tools.
- The confirmed monorepo root is `C:\Users\jimzord12\Documents\GitHub\ai-arsenal`.
- Git is initialized at the monorepo root with public remote `https://github.com/jimzord12/ai-arsenal`; the public `master` branch contains the Phase 7 reconciliation.
- The existing TypeScript/Bun CLI lives at `C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system\scripts\features-cli`.
- Its source worktree is at commit `ef977fe70663329f91c7145006eba93a92a161c3` on branch `remote-logging-system`; the CLI itself is Git-ignored and junction-shared, so that commit is consumer context rather than a CLI revision.
- The monorepo uses pnpm `10.33.0` and Turborepo `2.10.4`.
- npm packages use the `@jz/ai-arsenal-*` naming convention.
- The private CLI package boundary is `@jz/ai-arsenal-features-cli` at `packages/features-cli`.
- Phase 1 inspected the real CLI, ran its focused tests, observed real and disposable workflows, mapped consumers, and grounded the canonical plan.
- The selected initial distribution is a private npm-compatible source package requiring Bun, with no automated npm publication.
- The user explicitly approved the reconciled implementation plan and selected trade-offs on 2026-07-12.
- Phase 2 established the frozen workspace, pinned quality toolchain, hooks, Changesets policy, root documentation, and private CLI package placeholder.
- Phase 2 verification preserved all 14 top-level source CLI hashes and the 109-test source baseline.
- Phase 3 recorded a fresh formal source inventory, copied the non-archive CLI boundary, added package-local strict TypeScript/Jest/lint/coverage configuration, and adapted the package README.
- The migrated package now passes 139 tests across seven suites; representative source/migrated workflows match for command behavior and normalized persisted state.
- Phase 4 configured the private Bun source package with the `features-cli` executable and an explicit 10-file tarball boundary.
- The actual tarball passes strict publint and installs into a clean unrelated pnpm consumer; its Windows command shim invokes Bun and completes a disposable schema-v2 feature lifecycle.
- Phase 6 added a 14-test real-process E2E/distribution suite covering Bun/runtime help/parser behavior, feature and issue lifecycles, invalid/corrupt state, paths with spaces and Unicode, nested `cwd`, idempotency, recovery, stale locks, direct issue partial failure, writer contention, and clean packed-artifact installation/invocation.
- The real-process suite uses isolated temporary workspaces and confirms the private package retains its exact 10-file packed boundary.
- Phase 7 added separate GitHub Actions quality and Windows/Linux portability workflows. Quality run `29206475468` passed on Linux; Portability run `29206475467` passed on Ubuntu and Windows.
- Phase 8 added the repository LF checkout policy, final operating documentation, final clean-checkout validation, clean-consumer packed-artifact validation, hooks/Changesets validation, stale-path and mixed-lockfile checks, and final reconciliation.
- The user accepted Phase 8 final validation and operating documentation on 2026-07-12.
- Latest `master` CI also passes on commit `c87a1451742d0fd434bdf104b9e008cfa0c612d5`: Quality run `29206548378` and Portability run `29206548382`.
- The Linux CI failure on commit `b90a6bb` exposed a Corepack path assumption in the E2E harness; commits `3acdf64` and `8004c7a` made pnpm invocation portable and suppressed only Corepack's first-download prompt.
- The current tarball is installed in the Windows user's global pnpm environment. The primary `ics-vcr` checkout and its `remote-logging-system` worktree pass read-only stable-command and legacy-rollback smoke checks; three registered worktrees without `.scratch` and source-CLI junctions are not CLI consumers.
- Active consumer documentation and the five personal `jz-*` skills use the stable `features-cli` command; `docs/operations/features-cli-cutover.md` records installation, rollback, and the deletion gate.
- All 14 source hashes remain unchanged, `archives/v1/` was not copied, and the source remains available for rollback.

Not yet done:

- Decide whether to commit and push the accepted Phase 8 changes.
- The source CLI remains available for rollback and awaits its separate explicit deletion gate.

The immediate next action is defined in `NEXT.md`.

## Sources of Authority

Use this precedence:

1. Direct instructions from the user.
2. `[USER-LOCKED]` requirements in the canonical plan.
3. This `AGENTS.md` workflow contract.
4. The current canonical implementation plan.
5. `NEXT.md`, which is a derived operator view of the plan.
6. Historical evidence, ADRs, archived plans, and other references.

If `NEXT.md` conflicts with the canonical plan, stop and reconcile them before implementation.

Historical documents never override the canonical plan.

## Required Files

| File                                             | Responsibility                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `AGENTS.md`                                      | Stable repository operating rules and session-orientation contract  |
| `NEXT.md`                                        | Short generated operator view: what to do next and what it requires |
| `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` | Current authoritative project truth and living implementation plan  |
| `docs/evidence/`                                 | Discovery and phase-verification evidence                           |
| `docs/decisions/`                                | ADRs for architectural decisions whose rationale must be preserved  |
| `docs/input/`                                    | Unabsorbed source documents and user-provided references            |
| `docs/archive/`                                  | Superseded documents retained only for provenance                   |
| `.agents/skills/`                                | Repository-scoped workflow skills                                   |

Do not create competing implementation plans.

## Required Skills

### `initializing-living-plan-workflow`

Use when the workflow is first introduced, repository files are unorganized, or `AGENTS.md`, `NEXT.md`, the canonical plan, and their references are inconsistent.

It initializes or repairs workflow state. It does not implement product code.

### `executing-living-plan-phase`

Use when beginning or resuming one approved phase from the canonical plan.

It verifies prerequisites, executes one phase, verifies acceptance criteria, and requires reconciliation before any next phase.

### `reconciling-living-plan`

Use after a phase is verified or when a discovery materially invalidates the current plan.

It rewrites the canonical plan as current truth, updates `NEXT.md`, and surfaces changes requiring approval.

## Mandatory Workflow

```text
Orient from NEXT.md
→ confirm current phase and prerequisites
→ execute exactly one phase
→ verify its acceptance criteria
→ reconcile the canonical plan and NEXT.md
→ stop at any required approval gate
→ only then begin the next phase
```

A phase is not complete merely because code was written or tests passed.

A phase is complete only after:

- Its acceptance criteria are verified.
- Evidence is recorded.
- The canonical plan reflects the resulting reality.
- Remaining phases have been corrected for new discoveries.
- `NEXT.md` points to the correct next action.
- Required user approval has been obtained.

## Living-Plan Rules

The canonical plan represents **current truth**, not a narrative changelog.

After reconciliation:

- Correct assumptions naturally.
- Rewrite architecture and remaining work to match verified reality.
- Remove obsolete tasks.
- Add, split, merge, or reorder tasks when justified.
- Rewrite completed phase sections as resulting state and ongoing invariants.
- Do not add “originally we planned…” history to the canonical plan.
- Preserve historical rationale in Git history, phase evidence, or an ADR.

Do not churn wording when no material fact changed. Reconciliation must be idempotent.

## Approval Boundaries

The agent may autonomously reconcile:

- Verified file paths and package structure.
- Task ordering and decomposition.
- Test scenarios needed for discovered risks.
- Technical corrections that preserve user-locked intent.
- Removal of obsolete assumptions and tasks.
- Narrow testability refactors already within approved scope.

Stop and request approval before:

- Changing a user-locked requirement.
- Changing public CLI behavior or persisted schemas.
- Adding a major production dependency or service.
- Expanding project scope materially.
- Introducing meaningful cost, security, privacy, or operational burden.
- Changing the selected monorepo/package-manager direction.
- Deleting the source CLI or user data.
- Starting implementation after the discovery-plan approval gate.

## File Organization

During workflow initialization:

- Inventory every existing file before moving it.
- Preserve user-provided files.
- Place unabsorbed references in `docs/input/`.
- Integrate relevant truth into the canonical plan.
- Move superseded planning documents into `docs/archive/` only after their requirements have been accounted for.
- Store discovery and verification outputs under `docs/evidence/<phase-id>/`.
- Store durable architectural rationale as ADRs under `docs/decisions/`.
- Never treat `.scratch/` user data as disposable test output.
- Tests must use isolated temporary workspaces.

Do not move production code during workflow initialization.

## User-Locked Technical Direction

Until the user changes it:

- Monorepo package manager: pnpm.
- Task orchestration: Turborepo.
- Existing CLI runtime: Bun.
- Package prefix: `@jz/ai-arsenal-`.
- Intended CLI package: `@jz/ai-arsenal-features-cli`.
- Quality workflow: ESLint/Prettier, Husky, lint-staged, Conventional Commits, commitlint, and Changesets.
- Package validation: publint; use Are the Types Wrong only for packages exposing a TypeScript import surface.
- Initial release scope excludes automated npm publication.
- Prefer low-complexity, high-impact choices.
- Do not create generic shared packages before real reuse exists.

These are direction and constraints. Exact manifests, commands, architecture, build strategy, distribution model, and tests must be derived from repository evidence.

## Verification Discipline

Before claiming a phase complete:

- Run the phase’s exact verification commands.
- Inspect actual output and exit status.
- Record evidence.
- Run `reconciling-living-plan`.
- Run the workflow validator when available:

```bash
node scripts/validate-living-workflow.mjs
```

Never claim success from intent, partial output, or unexecuted commands.

<!-- living-plan-workflow:end -->
