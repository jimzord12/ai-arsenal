# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-13
**Project:** AI Arsenal monorepo and `features-cli` migration
**State:** Private `0.1.0` release is globally installed and verified; new `master` CI confirmation is pending
**Current phase:** Maintenance / CI confirmation

## Next Action

Confirm the new `master` Quality and Portability workflow runs for the flexible feature selector update when GitHub exposes them.

## Why This Is Next

- Commit `332cff2` merged the verified selector compatibility behavior into `master`.
- Changesets generated `@jz/ai-arsenal-features-cli@0.1.0` and its changelog entry.
- Root quality verification passed with 144 tests; strict publint passed; the actual 10-file tarball installed in a clean temporary consumer and ran `features-cli --help`.
- The user approved global replacement; pnpm now resolves `@jz/ai-arsenal-features-cli@0.1.0`.
- The global `features-cli` command successfully resolved both `--feature 3` and `--feature 003-remote-logging-mvp-v2` in the active `ics-vcr` consumer.

## Requirements

- [x] Selector compatibility is merged and pushed as `332cff2`.
- [x] Changeset versioning and generated changelog applied at `0.1.0`.
- [x] Versioned 10-file packed artifact passed strict publint and clean-consumer installation/invocation.
- [x] User approved global replacement; pnpm globally resolves `@jz/ai-arsenal-features-cli@0.1.0`.
- [x] The global command passed active-consumer index and full-name selector smoke checks.
- [ ] New `master` Quality and Portability workflows pass; GitHub has not yet exposed runs for `332cff2`.

## Blockers / Approval

- No further local-distribution approval is needed. CI visibility is external to the repository and remains the only outstanding release-handoff check.
- Preserve the source rollback copy, user `.scratch` data, approved Windows/Linux platform target, and LF checkout policy.
- Persisted schema changes, broader transaction semantics, distribution deviations, and source deletion remain approval-gated.

## Done When

- Version `0.1.0` and its generated changelog are committed and pushed after successful packed-artifact validation.
- The globally installed package resolves `0.1.0` and the active consumer smoke checks pass.
- The new `master` CI workflows have been confirmed when available.

## After This

- Return to release handoff and stop at the separate source-deletion gate. The user has explicitly said not to delete the legacy source CLI.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/evidence/maintenance-release-policy/`
- `docs/evidence/maintenance-private-release-0.1.0/`
- `docs/evidence/maintenance-feature-selector-compatibility/`
- `docs/evidence/phase-08-final-validation-operating-documentation/`
- `docs/operations/features-cli-cutover.md`
