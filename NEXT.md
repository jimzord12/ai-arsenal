# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-30
**Project:** AI Arsenal monorepo
**State:** Private Trello CLI `0.4.2` release `ea8c0a8627b740cbb587a4ab519c275d0b5137d5` passed exact-SHA Quality `30570080747` and Portability `30570080760`. Exact SHA-256 `ff6706e7e4b3ded79c0977a2d59ddcfec70595e17c06ff07386092ce3773f391` is globally installed; all 32 packed files byte-match, generated-shim help/docs pass, and variable-free dry-run/real/repeat skill installation preserves exact managed bytes and the unrelated sentinel. No Trello, Greek Essence, consumer-project, registry, or network state was accessed.
**Current phase:** Validate durable `0.4.2` installed-artifact evidence and close the active work item
**Active work item:** `2026-07-30-make-trello-skills-install-self-contained`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Commit and push the durable `0.4.2` installed-artifact evidence, pass exact-SHA Quality and Portability CI, then close the item through `deliver-monorepo-change`.

## Why This Is Next

- The runtime defect is fixed and `0.4.2` passed review, full verification, exact-SHA CI, official packed-payload validation, global replacement, and installed-artifact proof.
- The remaining mutation is planning/evidence only; product/package bytes already equal the CI-green release artifact.
- Closure requires CI-backed durable evidence before active registration is cleared.

## Requirements

- [x] Remove runtime Python/external-checkout validation and retain complete self-contained pre-mutation structural checks.
- [x] Preserve transaction, rollback/recovery, containment, dry-run, inventory, repeat, and unrelated-skill protections.
- [x] Move official pinned validation to a strict development/release command against exact transformed artifact bytes.
- [x] Version to `0.4.2`, pass complete gates and exact-SHA CI, pack the exact commit, and globally replace `0.4.1` after direct confirmation.
- [x] Verify global package/version, all packed bytes, generated shim, help/docs, variable-free dry-run/real/repeat installation, four-skill bytes, and sentinel preservation.
- [ ] Commit/push durable post-install evidence, pass its exact-SHA CI, close the item, clear active registration, and pass final closure CI.

## Blockers / Escalation

- No blocker or dangerous deletion is known.
- Greek Essence WU-20/WU-19, registry publication, and live Trello mutation are outside the authorized boundary.

## Done When

- Durable installed-artifact evidence and final closure each pass exact-SHA CI with a clean worktree.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/workflow/templates/work-item/work-item.md`
- `docs/work-items/2026-07-30-make-trello-skills-install-self-contained/work-item.md`
- `packages/trello-work-cli/package.json`
- `packages/trello-work-cli/src/skills-install.ts`
- `scripts/validate-trello-skills-official.ts`
- `scripts/verify-trello-skills-install-bytes.mjs`
