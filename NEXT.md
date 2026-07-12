# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-12
**Project:** AI Arsenal monorepo and `features-cli` migration
**State:** Phase 8 final validation and operating documentation accepted
**Current phase:** Maintenance / release handoff

## Next Action

Decide whether to commit and push the accepted Phase 8 changes.

## Why This Is Next

- Complete local validation passes with the pinned Node, pnpm, and Bun toolchain.
- Simulated clean-checkout validation passes with LF checkout policy, frozen install, formatting, linting, strict typechecking, 139 tests, strict package validation, and workflow validation.
- The actual packed source artifact installs into an unrelated consumer, exposes `features-cli`, completes a disposable schema-v2 lifecycle, and preserves the exact 10-file package boundary.
- Hooks, commitlint, Changesets status, stale-path review, mixed-lockfile review, unabsorbed-input review, and latest `master` CI verification pass.
- Root and package documentation now describe current architecture, development, package validation, consumer usage, Changesets release flow, private release policy, known constraints, rollback, and approval gates.
- The user accepted the completed Phase 8 migration and operating documentation on 2026-07-12.

## Requirements

- [x] Phase 8 final clean-checkout validation completed.
- [x] Clean-consumer packed-artifact validation completed.
- [x] Hooks and Changesets workflow validated.
- [x] No mixed lockfiles or unabsorbed input plans found.
- [x] Stale source-path references limited to source provenance, rollback documentation, and frozen legacy usage output.
- [x] Latest Quality and Portability workflows passed on `master`.
- [x] Canonical plan and `NEXT.md` reconciled.
- [x] User final acceptance received.

## Blockers / Approval

- Commit and push require explicit user direction.
- Public behavior/schema changes, broader transaction semantics, distribution deviations, user `.scratch` mutation, and source deletion remain approval-gated.
- Preserve the legacy usage string, source rollback copy, user `.scratch` data, approved Windows/Linux platform target, and LF checkout policy.

## Done When

- Accepted Phase 8 changes are either committed and pushed, or intentionally left local.
- The repository remains maintenance/release-ready rather than an incomplete migration.

## After This

- Stop at the separate source-deletion gate. The user has explicitly said not to delete the legacy source CLI.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/evidence/phase-08-final-validation-operating-documentation/`
- `docs/operations/features-cli-cutover.md`
