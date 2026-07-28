# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-28
**Project:** AI Arsenal monorepo
**State:** Archived-list canonical resolution is implemented, independently verified, and reconciled; Git/CI capture remains before installation or live TestingBoard retry.
**Current phase:** Maintenance / Trello archived-list resolution Git and CI capture
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Commit and push the exact verified archived-list canonical-resolution snapshot, then confirm required GitHub Actions pass for that commit.

## Why This Is Next

- Active canonical mapping now ignores archived namesakes and rejects archived configured targets before active handlers.
- Offline package/root/workflow gates and fresh independent review pass.
- Git/CI capture is required before installing the exact package or retrying the live workbook.

## Requirements

- [ ] Commit only the reconciled work-item, Trello source/test, canonical-plan, and `NEXT.md` paths.
- [ ] Push `master` without rewriting history and verify `origin/master` contains the commit.
- [ ] Confirm required Quality and Portability GitHub Actions pass for the exact commit.
- [ ] Preserve the exact captured package provenance for the later installation gate.

## Blockers / Approval

- No global installation or live workbook retry until the pushed commit is CI-green.
- Live access remains restricted to TestingBoard `6a16bbf1fea5389eb39636b7`.
- Publication, production-board access, source deletion, and any other board remain unapproved.

## Done When

- The exact verified snapshot is committed, pushed, contained in `origin/master`, and required CI is green.

## After This

- Install the exact captured local package and resume the separately authorized TestingBoard onboarding workbook from a fresh preflight.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/work-items/2026-07-28-ignore-archived-lists-in-canonical-resolution/verification.md`
- `docs/work-items/2026-07-28-ignore-archived-lists-in-canonical-resolution/reconciliation.md`
