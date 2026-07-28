# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-28
**Project:** AI Arsenal monorepo
**State:** Revised Trello Work CLI intake/design lifecycle is independently verified offline; repository capture and authorized TestingBoard validation remain.
**Current phase:** Maintenance / Trello Work CLI post-verification capture
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Commit and push the exact verified snapshot, then verify the remote commit and Quality/Portability CI.

## Why This Is Next

- The revised CLI passes 230 offline tests, package/root/workflow gates, strict package validation, affected-path audit, and independent review with no Critical or High findings.
- Repository stages correctly performed no global installation or Trello mutation.
- The user approved capture before installing and exercising the exact captured package.

## Requirements

- [x] Keep credentials process-environment-only and out of repository evidence.
- [x] Preserve zero retained `.tgz` files and the exact reviewed snapshot.
- [ ] Commit and push the verified snapshot; verify remote commit and CI.
- [ ] After capture, globally install only the captured local package and run the authorized workbook only on TestingBoard `6a16bbf1fea5389eb39636b7`.

## Blockers / Approval

- No blocker to the approved repository capture.
- Publication, production-board access, source deletion, and any board other than TestingBoard remain unapproved.

## Done When

- The verified snapshot is present on `origin/master` with Quality and Portability CI passing.

## After This

- Install the captured local Trello CLI globally and execute the separately authorized TestingBoard onboarding workbook with credential-free evidence and complete cleanup.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/work-items/2026-07-28-trello-cli-onboarding-fixes/`
- `docs/operations/trello-work-cli-onboarding-workbook.md`
