# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-13
**Project:** AI Arsenal monorepo and `features-cli` migration
**State:** Private `0.1.0` release is verified; global package replacement is pending user confirmation
**Current phase:** Maintenance / local distribution handoff

## Next Action

Ask whether to replace the globally installed `@jz/ai-arsenal-features-cli` package with the verified `0.1.0` tarball.

## Why This Is Next

- Commit `332cff2` merged the verified selector compatibility behavior into `master`.
- Changesets generated `@jz/ai-arsenal-features-cli@0.1.0` and its changelog entry.
- Root quality verification passed with 144 tests; strict publint passed; the actual 10-file tarball installed in a clean temporary consumer and ran `features-cli --help`.
- Global package replacement remains explicitly user-confirmed rather than automatic.

## Requirements

- [x] Selector compatibility is merged and pushed as `332cff2`.
- [x] Changeset versioning and generated changelog applied at `0.1.0`.
- [x] Versioned 10-file packed artifact passed strict publint and clean-consumer installation/invocation.
- [ ] User confirms whether to replace the globally installed package.
- [ ] New `master` Quality and Portability workflows pass; GitHub has not yet exposed runs for `332cff2`.

## Blockers / Approval

- The user explicitly approved the private `0.1.0` release, but global package replacement still requires a separate confirmation now that the versioned artifact is ready.
- Preserve the source rollback copy, user `.scratch` data, approved Windows/Linux platform target, and LF checkout policy.
- Persisted schema changes, broader transaction semantics, distribution deviations, and source deletion remain approval-gated.

## Done When

- Version `0.1.0` and its generated changelog are committed and pushed after successful packed-artifact validation.
- The user has explicitly decided whether to replace the globally installed package.
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
