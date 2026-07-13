# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-13
**Project:** AI Arsenal monorepo and `features-cli` migration
**State:** Monorepo work-item pipeline design and implementation plan are approved; implementation is in progress
**Current phase:** Maintenance / monorepo work-item pipeline implementation

## Next Action

Implement and verify the approved Monorepo Work-Item Pipeline plan, then reconcile the living workflow.

## Why This Is Next

- The user explicitly approved implementation on 2026-07-13 and directed this work to take priority over pending CI confirmation.
- The approved design and implementation plan define the exact artifact, revision, approval-digest, validation, routing, and self-hosting contracts.
- The current broad living-plan execution loop must be replaced only after the new pipeline passes focused, integrated, and wide independent review.
- The previously pending Quality and Portability run confirmation remains deferred follow-up and is not discarded.

## Requirements

- [x] Approved design and implementation plan are present.
- [x] The user explicitly approved starting implementation.
- [x] Existing approved uncommitted work is preserved.
- [ ] Tasks 1–12 pass their focused and integrated checks.
- [ ] Three independent wide-review lenses have no unresolved concrete findings.
- [ ] Final root verification and living-plan reconciliation pass.

## Blockers / Approval

- No implementation approval is outstanding for the approved work-item pipeline plan.
- Do not commit or push without separate user direction.
- Preserve the source rollback copy, user `.scratch` data, approved Windows/Linux platform target, and LF checkout policy.
- Persisted schema changes, broader transaction semantics, distribution deviations, and source deletion remain approval-gated.

## Done When

- The artifact-driven pipeline, validator, router, eight write-capable stage skills, governance integration, and disposable lifecycle simulation match the approved contracts.
- `pnpm check`, `pnpm validate:workflow`, and `git diff --check` pass after review repairs.
- Reconciliation evidence records the resulting state and the exact next action.

## After This

- Return to the deferred `master` Quality and Portability run confirmation unless verified evidence changes the canonical next action. Source deletion remains unapproved.

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
