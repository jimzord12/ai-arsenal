# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-13
**Project:** AI Arsenal monorepo and `features-cli` migration
**State:** Flexible feature selector compatibility verified on its feature branch
**Current phase:** Maintenance / flexible feature selector compatibility

## Next Action

Merge and push the verified feature-selector compatibility branch, then confirm the resulting `master` Quality and Portability workflows.

## Why This Is Next

- The user approved compatibility for slugs, plain or zero-padded IDs, and matching full `ID-slug` feature names on 2026-07-13.
- The shared resolver applies the behavior consistently to every `--feature` command while preserving exact-slug precedence.
- Package formatting, linting, strict typechecking, strict package validation, and 144 tests across seven suites pass.
- Help and package documentation define the new `<selector>` contract and retain slugs as the preferred script form.

## Requirements

- [x] Selector resolver and command-level regression tests pass.
- [x] Package formatting, linting, strict typechecking, 144-test suite, and strict publint package validation pass.
- [x] Maintenance evidence, canonical plan, and `NEXT.md` reconciled.
- [ ] Verified branch is merged into `master` and pushed.
- [ ] New `master` Quality and Portability workflows pass.

## Blockers / Approval

- The user explicitly approved this public CLI behavior change and the merge/push workflow.
- Preserve the source rollback copy, user `.scratch` data, approved Windows/Linux platform target, and LF checkout policy.
- Persisted schema changes, broader transaction semantics, distribution deviations, and source deletion remain approval-gated.

## Done When

- The compatibility change is on `master`, pushed, and verified by Quality and Portability CI.
- The repository returns to maintenance/release-ready state.

## After This

- Return to release handoff and stop at the separate source-deletion gate. The user has explicitly said not to delete the legacy source CLI.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/evidence/maintenance-feature-selector-compatibility/`
- `docs/evidence/phase-08-final-validation-operating-documentation/`
- `docs/operations/features-cli-cutover.md`
