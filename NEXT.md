# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-12
**Project:** AI Arsenal monorepo and `features-cli` migration
**State:** Phase 7 CI configuration and consumer cutover verified locally; GitHub CI is unexecuted
**Current phase:** Phase 7 — CI, Portability, Consumer Cutover, and Source Retirement

## Next Action

Obtain user direction to create the initial Git commit and configure the GitHub remote, then run and inspect the configured Windows/Linux CI workflows for Phase 7.

## Why This Is Next

- The quality workflow and Windows/Linux process-distribution matrix are defined with the pinned toolchain and frozen pnpm installation.
- Local quality verification, strict package validation, and the Windows real-process/distribution suite pass.
- The packed private artifact is installed globally; stable and rollback read-only smoke checks pass in the two `ics-vcr` worktrees that mount the shared `.scratch` junction.
- Consumer documentation uses the stable executable and records the legacy command as rollback.

## Requirements

- [x] Phase 6 is verified and reconciled with 139 passing tests across seven suites.
- [x] Real-process E2E and clean-consumer packed-artifact coverage preserve the CLI, schema, `cwd`, user bytes, and 10-file boundary.
- [x] Define quality CI plus Windows/Linux process and packed-artifact smoke coverage.
- [x] Complete read-only consumer discovery, approved consumer cutover, and explicit rollback documentation.
- [ ] Create the initial commit, configure the GitHub remote, and verify both CI operating systems.
- [ ] Preserve the source CLI until CI passes and the explicit source-deletion gate is satisfied.

## Blockers / Approval

- The repository has no commit or Git remote, so GitHub Actions cannot execute. This Windows machine has no Linux distribution; the GitHub-hosted Linux runner is the verification path.
- User direction is required to establish the initial commit and remote. Public behavior/schema changes, broader transaction semantics, distribution deviations, user `.scratch` mutation, and source deletion remain approval-gated.
- Preserve the legacy usage string, source rollback copy, user `.scratch` data, and the approved Windows/Linux platform target.

## Done When

- The configured Windows and Linux workflows pass against the first pushed commit.
- Active consumers continue using the stable executable with documented rollback, and the source remains intact until its explicit deletion gate.
- Phase 7 evidence and living-plan reconciliation show the executed CI results.

## After This

- Reconcile Phase 7 only after CI execution, then stop before Phase 8 and any source deletion decision.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/evidence/phase-07-ci-portability-consumer-cutover/`
