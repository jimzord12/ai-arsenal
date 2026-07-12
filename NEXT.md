# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-12
**Project:** AI Arsenal monorepo and `features-cli` migration
**State:** Phase 7 CI, portability, and consumer cutover verified in the public repository
**Current phase:** Phase 8 — Final Validation and Operating Documentation

## Next Action

Obtain user direction to begin Phase 8, then invoke `$executing-living-plan-phase` for Final Validation and Operating Documentation.

## Why This Is Next

- Quality run `29206253391` passed on Linux, and Portability run `29206253402` passed on Ubuntu and Windows.
- The pinned toolchain, frozen install, strict package validation, real-process E2E, packed-artifact smoke, path, and concurrency cases pass in CI.
- The packed private artifact is installed globally; stable and rollback read-only smoke checks pass in the two `ics-vcr` worktrees that mount the shared `.scratch` junction.
- Consumer documentation uses the stable executable and records the legacy command as rollback; the source remains intact.

## Requirements

- [x] Phase 6 is verified and reconciled with 139 passing tests across seven suites.
- [x] Real-process E2E and clean-consumer packed-artifact coverage preserve the CLI, schema, `cwd`, user bytes, and 10-file boundary.
- [x] Define and execute quality CI plus Windows/Linux process and packed-artifact smoke coverage.
- [x] Complete read-only consumer discovery, approved consumer cutover, and explicit rollback documentation.
- [x] Create the public GitHub repository and push the initial AI Arsenal history.
- [x] Preserve the source CLI through CI and the explicit source-deletion gate.
- [ ] Complete Phase 8 final validation and operating documentation.

## Blockers / Approval

- Phase 7 has no remaining CI blocker. Phase 8 requires user direction before implementation begins.
- Public behavior/schema changes, broader transaction semantics, distribution deviations, user `.scratch` mutation, and source deletion remain approval-gated.
- Preserve the legacy usage string, source rollback copy, user `.scratch` data, and the approved Windows/Linux platform target.

## Done When

- Phase 8 final validation and operating documentation are complete and accepted.
- Active consumers continue using the stable executable with documented rollback, and the source remains intact until its explicit deletion gate.
- The canonical plan and `NEXT.md` describe maintenance/release work rather than an incomplete migration.

## After This

- Stop at the Phase 8 final-acceptance gate before any source deletion decision.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/evidence/phase-07-ci-portability-consumer-cutover/`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
