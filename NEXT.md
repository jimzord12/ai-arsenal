# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-24
**Project:** AI Arsenal monorepo and `features-cli` migration
**State:** Monorepo work-item pipeline is verified and reconciled; authorized publication is pending
**Current phase:** Maintenance / publication and CI confirmation
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Split the verified worktree into logical commits, push the authorized changes, and confirm the resulting GitHub Actions runs.

## Why This Is Next

- The pipeline implementation, focused tests, full repository check, independent verification, and reconciliation all passed.
- The user separately authorized committing and pushing the verified worktree.
- `master` already contains five local commits not yet present on `origin/master`; the new logical commits must be added without mixing unrelated changes.
- Quality and Portability CI confirmation remains required after the push.

## Requirements

- [x] The approved implementation plan and digest-bound approval are recorded.
- [x] The 30-test workflow suite and full `pnpm check` pass.
- [x] Independent verification and reconciliation pass.
- [x] Commit and push authorization is explicit.
- [ ] Logical commits are created and pushed.
- [ ] New GitHub Actions Quality and Portability runs pass.

## Blockers / Approval

- No implementation, verification, reconciliation, commit, or push approval is outstanding for the current verified worktree.
- Preserve the source rollback copy, user `.scratch` data, approved Windows/Linux platform target, and LF checkout policy.
- Persisted schema changes, broader transaction semantics, distribution deviations, and source deletion remain approval-gated.

## Done When

- The approved logical commits are present on the public remote.
- Quality and Portability workflows pass for the pushed `master` commit.

## After This

- Source deletion remains separately approval-controlled and unapproved.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/superpowers/specs/2026-07-13-monorepo-work-item-pipeline-design.md`
- `docs/superpowers/plans/2026-07-13-monorepo-work-item-pipeline.md`
- `docs/evidence/maintenance-release-policy/`
- `docs/evidence/maintenance-private-release-0.1.0/`
- `docs/evidence/maintenance-feature-selector-compatibility/`
- `docs/evidence/phase-08-final-validation-operating-documentation/`
- `docs/operations/features-cli-cutover.md`
