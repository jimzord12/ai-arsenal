# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-08-02
**Project:** AI Arsenal monorepo
**State:** The legacy Features CLI rollback junction is retired and delivered; `jz-trello-flow` version flags are the active bounded change.
**Current phase:** Add Trello Flow CLI version flags
**Active work item:** `2026-08-02-trello-cli-version-flags`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Implement and release top-level `jz-trello-flow -v` and `--version` support.

## Why This Is Next

- The package currently treats both requested flags as unknown commands.
- This is a public CLI behavior change and requires the complete private
  package version, packed-artifact, global-install, and CI delivery chain.

## Requirements

- Preserve all existing command behavior and command-specific `--if-version`
  semantics; version flags must be credential-free and offline.

## Blockers / Escalation

- No active blocker.

## Done When

- Both public flags are released and independently verified from the exact
  globally installed private artifact.

## Source of Truth

- `AGENTS.md`
- `docs/work-items/2026-08-02-trello-cli-version-flags/work-item.md`
- `docs/operations/features-cli-cutover.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
