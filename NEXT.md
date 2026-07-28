# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-28
**Project:** AI Arsenal monorepo
**State:** Trello Flow CLI `0.2.0` executable rename is independently verified; Git/CI capture, exact global installation, and the TestingBoard workbook remain.
**Current phase:** Maintenance / Trello Flow CLI 0.2.0 rename, installation, and live workbook
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Complete independent verification of the exact `0.2.0` snapshot, commit and push it, confirm required GitHub Actions pass, globally install that exact package, then run the authorized onboarding workbook only on TestingBoard until it passes.

## Why This Is Next

- Package identity, changelog, packed boundary, package/root gates, and independent review pass.
- Exact Git/CI provenance is required before global installation.

## Requirements

- [ ] Commit only task-owned version/changelog, work-item, planning, and `NEXT.md` paths.
- [ ] Push `master` and verify `origin/master` contains the exact commit.
- [ ] Confirm Quality and Portability CI pass for that SHA.
- [ ] Globally install `@jz/ai-arsenal-trello-work-cli@0.2.0` from that exact checkout.
- [ ] Verify global package registration and read-only `jz-trello-flow --help`.

## Blockers / Approval

- Do not install before green CI.
- Do not publish or access Trello during installation verification.
- Live TestingBoard workbook execution remains separate.

## Done When

- Exact commit is remote and CI-green; global pnpm reports version `0.2.0`; `jz-trello-flow --help` exits successfully without credentials; the TestingBoard onboarding workbook passes.

## After This

- Resume the separately authorized TestingBoard onboarding workbook from a fresh preflight.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/work-items/2026-07-28-version-trello-work-cli/verification.md`
- `docs/work-items/2026-07-28-version-trello-work-cli/reconciliation.md`
