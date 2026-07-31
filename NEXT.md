# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-31
**Project:** AI Arsenal monorepo
**State:** WU-30 recovery is delivered: weekly-report CLI `0.1.1` is merged, exact-commit CI-green, byte-proven, globally installed, independently smoked, and Trello read-back-confirmed Done.
**Current phase:** Await the next bounded request
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Use `define-monorepo-change` for the next explicit bounded monorepo request.

## Why This Is Next

- Recovery PR `#20` is merged at `0f6dee6abc3e689ffb7e743649451335a00b288b`; local and remote default-branch revisions matched, and weekly-report package bytes match exact CI-green artifact commit `0bd9416ae8b7fd4f99be390c31247844788f3905`.
- Exact private `0.1.1` tarball SHA-256 `60adadd364debf8dfe77b14a6634d70fbe203f8cfe356a11823fefecaaf505f7` contains eight files, byte-matches the global installation, and passes clean-consumer plus generated-shim smoke.
- Trello WU-30 moved through guarded In Progress → Review → Done transitions with current-version checks, durable operation identities, dry-runs, and read-backs.

## Requirements

- Preserve the delivered `0.1.1` privacy, evidence-integrity, Git-process, and packed-boundary contracts.
- Keep registry publication, consumer access, and source deletion behind separate explicit scope.
- WU-31 is no longer blocked by WU-30, but it has not been started by this recovery.

## Blockers / Escalation

- No active blocker.

## Done When

- A new explicit bounded request is defined as a compact Workflow v2 work item.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-07-31-recover-git-evidence-collector/work-item.md`
- `docs/work-items/2026-07-31-add-git-evidence-collector/work-item.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
