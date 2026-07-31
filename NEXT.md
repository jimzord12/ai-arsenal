# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** The verified Node.js 24 `weekly-report-cli` foundation is being extended with bounded deterministic Git evidence collection.
**Current phase:** Deliver the Git evidence collector
**Active work item:** `2026-07-31-add-git-evidence-collector`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Use `deliver-monorepo-change` for `2026-07-31-add-git-evidence-collector`.

## Why This Is Next

- The bounded implementation, independent review, and final stable-snapshot verification passed.
- Delivery must commit and push the artifact-bearing snapshot, observe CI, then pack and install that exact CI-green commit before workflow closure.
- Deployment collection and private integration remain separate work.

## Requirements

- Keep the public collector generic and free of consumer identities, credentials, private history, and delivery behavior.
- Preserve the Node.js 24 compiled executable, validated JSON, stdout/stderr, exit-code, and exact packed-artifact boundaries.
- Use synthetic temporary repositories for development and verification.
- Complete the repository-mandated Changesets, exact-CI-green packing, checksum, global installation, smoke verification, and rollback-evidence chain for CLI behavior changes.

## Blockers / Escalation

- No active blocker.
- Dangerous deletion or irreversible data loss is not authorized or required.

## Done When

- The work item's review, verification, delivery, versioned local distribution, and workflow closure requirements pass.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-07-31-add-git-evidence-collector/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
