# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-24
**Project:** AI Arsenal monorepo and `features-cli` migration
**State:** Built-in offline workflow documentation is implemented and independently verified; no release or distribution action is authorized.
**Current phase:** Maintenance / verified docs command
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Decide whether to authorize a separate release, local/global distribution, or commit/push operation for the verified docs-command change.

## Why This Is Next

- The active work item completed implementation, independent verification, and reconciliation.
- The docs command changes the public CLI and packed package boundary from 10 to 11 files, while no release, global installation, commit, or push was authorized by this work item.

## Requirements

- [x] Offline/read-only docs overview, index, topics, current guidance, JSON, and help integration are verified.
- [x] Full repository checks, strict publint, exact 11-file pack, and clean-consumer invocation pass.
- [ ] Any release, packing for distribution, global installation, commit, or push receives its separate explicit authorization.

## Blockers / Approval

- Release, local/global distribution, commit, and push are not authorized by the completed work item.
- Preserve the source rollback copy and user `.scratch` data; source deletion remains separately unapproved.

## Done When

- The user chooses whether to retain this verified worktree, authorize commit/push, or authorize a release/distribution operation under its applicable gate.

## After This

- Source deletion remains separately approval-controlled and unapproved.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/work-items/2026-07-24-features-cli-built-in-workflow-docs/`
- `docs/operations/features-cli-cutover.md`
