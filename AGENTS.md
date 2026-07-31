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
4. Check hard prerequisites, proportionality timing, review state, and verification evidence.
5. Do not begin work from memory or from an older plan.

When the user asks **“What is going on?”**, **“Where are we?”**, or anything equivalent, answer in this exact compact shape:

```text
Project:
Current state:
Next action:
Requirements/blockers:
Why this is next:
Escalation needed:
```

The answer must be understandable in approximately 30 seconds. Do not give a wall of text unless the user asks for detail.

## Current Project State

This repository is currently an **implemented public monorepo with Phase 8 final validation accepted and an approved monorepo work-item pipeline being integrated**.

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
- Version `0.1.0` is the verified private release for flexible feature selectors. Its packed tarball has the expected 10-file boundary, installs into a clean unrelated consumer, and is installed in the Windows user's global pnpm environment. The global `features-cli` command passed read-only index (`3`) and full-name (`003-remote-logging-mvp-v2`) selector smoke checks in the primary `ics-vcr` checkout. Its `remote-logging-system` worktree also retains its earlier stable-command and legacy-rollback smoke checks; three registered worktrees without `.scratch` and source-CLI junctions are not CLI consumers.
- Trello Flow CLI `0.5.1` is the verified private release for all-visible/open-card member filtering, distinct metadata-owner filtering, and self-contained bundled Agent Skill installation. Artifact commit `f4d756cd634898804850cfc20596b7f145ef7515` passed exact-SHA Quality `30618130182` and Windows/Linux Portability `30618130154`; its exact 32-file SHA-256 `ee8671d777865cf1d9ff8de1d21c84d8e08dff70ca49602b0a172b4d90ebee66` artifact is globally installed and byte-proven. The installed shim returns matching ordinary cards and Work Units, excludes archived cards, preserves normalized Work Unit-only output without `--member`, keeps metadata filters Work Unit-specific, and passes read-only TestingBoard smoke. Exact `0.5.0` rollback remains available.
- Active consumer documentation and the five personal `jz-*` skills use the stable `features-cli` command; `docs/operations/features-cli-cutover.md` records installation, rollback, and the deletion gate.
- All 14 source hashes remain unchanged, `archives/v1/` was not copied, and the source remains available for rollback.
- Commit `332cff2` on `master` adds verified flexible `--feature` selectors. The approved private `0.1.0` release has a generated Changesets changelog, validated packed artifact, and verified global installation.
- Workflow v2 review-barrier integration issue `#19` is delivered and closed. Artifact commit `b7b095d27fb2750bfeaef670a384670e7fe30dda` passed exact-SHA Quality runs `30652534854` and `30652535100` plus Portability runs `30652534982` and `30652535659`; the blocked four-cycle predecessor and user-authorized one-attempt successor preserve the complete audit.

Not yet done:

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

### `orchestrate-monorepo-work`

Use as the normal read-only entry point for monorepo work, resume requests, and
status routing. It validates active workflow state and selects the earliest
eligible stage without mutating files or Git state.

### Normal Monorepo Work-Item Stages

Use the router-selected stage only after its prerequisites are valid:

1. `define-monorepo-change`
2. `implement-monorepo-change`
3. `review-monorepo-change`
4. `verify-monorepo-change`
5. `deliver-monorepo-change`

All current state lives in one `docs/work-items/<id>/work-item.md`. Historical
v1 multi-file work items remain readable but never dictate routing for v2 work.

Review uses one snapshot-bound evidence contract across every live Workflow v2
surface. `Review status`, `Review snapshot`, `Review batch`, `Review expected`,
and `Review received` start pending. A concrete batch passes only when every
expected reviewer has exactly one matching successful result for the recorded
snapshot. Candidate-changing repair resets all five fields to pending; verify
and deliver fail closed until a fresh complete batch passes. Historical
compatibility is limited to validator-recognized immutable delivered records.
The snapshot comes only from `scripts/calculate-review-snapshot.mjs`; `NEXT.md`
is excluded as routing-only state.

### `initializing-living-plan-workflow`

Use only for workflow bootstrap or router-reported structural corruption. It
repairs metadata and returns to `orchestrate-monorepo-work`; it does not
execute a normal work-item stage.

### `executing-living-plan-phase`

Use only as a compatibility wrapper for legacy phase-execution instructions. It
routes to `orchestrate-monorepo-work` and never broadly executes a phase.

### `reconciling-living-plan`

Use only for verified legacy-plan repair outside a normal active work item.
Normal passed work items must use `deliver-monorepo-change`.

## Mandatory Workflow

```text
orchestrate-monorepo-work (read-only)
→ define-monorepo-change
→ implement-monorepo-change
→ review-monorepo-change (repair and re-review, maximum four cycles)
→ verify-monorepo-change
→ deliver-monorepo-change
→ router reports the resulting next action
```

The router selects the stage recorded in validator-confirmed `work-item.md`.
If it reports malformed workflow metadata, stop at
`initializing-living-plan-workflow`; do not infer a stage or repair user intent.

A normal work item is complete only after:

- Review has no unresolved required findings and final verification passed.
- The canonical plan and `NEXT.md` reflect verified current truth.
- Active work-item fields are cleared and both workflow validators pass.
- The compact item is marked delivered. Routine work has no approval artifact.

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

## Autonomy and Escalation Boundaries

Agents are fully autonomous for bounded repository work. The work-item pipeline
is an evidence and safety system, not a sequence of permission prompts. Continue
through definition, implementation, review/repair, verification, delivery,
routine commit, and routine push without asking the user again
when the operation is within the recorded contract and required prerequisites
are available.

The agent may autonomously perform:

- Verified file paths and package structure.
- Task ordering and decomposition.
- Test scenarios needed for discovered risks.
- Technical corrections that preserve user-locked intent.
- Removal of obsolete assumptions and tasks.
- Narrow testability refactors already within approved scope.
- Public CLI and schema changes explicitly contained in the work-item contract.
- Routine dependency, Git, review, and recoverable external operations required
  by the bounded plan.

For dangerous deletion or similarly irreversible data loss, obtain direct user
approval recorded in `work-item.md` and fresh direct confirmation immediately
before executing the exact destructive operation. Escalate, without
fabricating a substitute, when a hard prerequisite
is unavailable or no honest workaround can satisfy the contract, including
missing credentials/access required for E2E tests, contradictory authority, or
a technically impossible requirement.

Do not replace required live/E2E evidence with mocks merely to avoid escalation.
Do not turn normal uncertainty, a failed test, review findings, plan revision,
commit, push, or an in-contract recoverable mutation into a permission stop.
Resolve routine ambiguity from repository authority and recorded acceptance
criteria. When a new request materially changes the active contract, revise the
compact definition and continue autonomously unless one of the narrow stop conditions
above applies.

## Proportionality and Review Limits

- Estimate maximum work time and record the start time during definition.
- At the start of every agent turn that creates or resumes an item in any v2
  stage, increment the durable turn counter once. If the increment reaches
  five, compare elapsed work with the estimate and scope, record the check,
  update its timestamp, and reset the counter. The validator checks the durable
  value only; it cannot observe unrecorded conversational turns. Exceeding the
  estimate is an indicator to simplify or report—not an automatic failure.
- Use focused tests during implementation. Run full required gates once on the
  final stable snapshot and rerun only checks invalidated by later repairs.
- Review uses consolidated findings and at most four repair/re-review cycles.
  Fix every Critical, High, Medium, and acceptance-related Minor finding.
  Ignore optional or out-of-scope polish. After cycle four, record remaining
  blockers and stop.

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

## CLI Change, Release, and Local-Distribution Rules

Every completed feature, fix, or other behavior change to an AI Arsenal CLI package must include the complete versioned local-delivery chain in the same bounded body of work. CLI source delivery is not complete after tests and a source commit alone.

1. Use SemVer to choose the package bump, create a Changeset, and apply it with `pnpm version-packages`; do not hand-edit package versions or changelogs. The configured Changesets workflow versions private packages and generates their changelogs.
2. Include the resulting package-manifest version and generated `CHANGELOG.md` in the reviewed delivery snapshot. Run the full package gates, repository gates, packed-artifact validation, and a clean disposable-consumer installation from the exact generated tarball.
3. After the exact reviewed snapshot is committed and pushed and its required GitHub Actions CI is successful, pack that exact CI-green commit and install or replace the resulting package in the Windows user's global pnpm environment. Do not globally link a mutable source tree.
4. Verify the global installation independently: confirm the installed package name and exact version, invoke the public executable through the generated global shim, run version/help plus a feature-relevant read-only or disposable smoke test, and confirm the observed behavior comes from the installed artifact rather than the repository source tree.
5. Record the package version, tarball identity/checksum, global install command, installed-version proof, smoke results, commit SHA, remote SHA equality, clean worktree, and successful CI run URLs in durable work-item/reconciliation evidence.
6. Treat Changeset creation/application, package versioning, exact-commit packing, global pnpm installation, installation verification, commit, push, and CI verification as mandatory completion steps for CLI behavior work. Do not leave them as an optional follow-up release unless the user explicitly narrows the requested boundary.
7. The bounded work item must include preflight, rollback, and verification for global replacement. Proceed autonomously when prerequisites exist; escalate only for unavailable access, an unworkable rollback requirement, or a dangerous deletion/data-loss step.

Documentation-only, planning-only, test-only, or workflow-policy changes that do not alter a shipped CLI package's behavior do not trigger a package version bump or global reinstall.

These are direction and constraints. Exact manifests, commands, architecture, build strategy, distribution model, and tests must be derived from repository evidence.

## Verification Discipline

Before claiming a normal active work item complete:

- Run its exact verification commands and inspect actual output and exit status.
- Record verification in `work-item.md`, then use `deliver-monorepo-change`
  only after it passes.
- Confirm the completed active-registration state with both workflow validators.
- Use `reconciling-living-plan` only for a verified legacy-plan repair outside
  a normal active work item.

```bash
node scripts/validate-living-workflow.mjs
```

Never claim success from intent, partial output, or unexecuted commands.

<!-- living-plan-workflow:end -->
