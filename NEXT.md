# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** WU-30 recovery review and final verification passed; commit, PR, exact-commit CI, artifact installation, and closure evidence remain.
**Current phase:** Deliver repaired Git evidence collector
**Active work item:** `2026-07-31-recover-git-evidence-collector`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Use `deliver-monorepo-change` for `2026-07-31-recover-git-evidence-collector`.

## Why This Is Next

- Focused RED→GREEN coverage now repairs credential-redaction, evidence-validation, strict-instant, nested-remote, and submodule-fetch defects while preserving prior collector safeguards.
- Original WU-30 delivery evidence remains historical; this corrective Workflow v2 item repairs forward without implying the late review had passed.
- Three fresh independent reviewers approved exact stable candidate `ac74223b491c438d4c1c29b3e6aabd13b60f2f7f2ab5cfb287b8a1dcb16138b6`, and the complete final verification matrix passed.

## Requirements

- Use focused RED→GREEN regressions and the smallest complete repairs.
- Deliver one coherent recovery PR and a Changesets-generated patch release.
- Require fresh independent review and exact-commit Quality plus Windows/Linux Portability CI before packing or global replacement.
- Preserve the public/private boundary and never expose rejected credential-bearing input.

## Blockers / Escalation

- No active blocker.
- Registry publication, consumer-repository access, destructive cleanup, and WU-31 implementation are not authorized or required.
- The primary worktree contains unrelated active Trello member-filtering changes; recovery is isolated in its own worktree and branch.

## Done When

- The corrective work item and planning truth are delivered, the exact repaired artifact has replaced global `0.1.0` with independent proof, and Trello WU-30 is read-back-confirmed Done.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-07-31-recover-git-evidence-collector/work-item.md`
- `docs/work-items/2026-07-31-add-git-evidence-collector/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
