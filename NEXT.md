# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-28
**Project:** AI Arsenal monorepo
**State:** Trello Work CLI `0.1.0` and its generated changelog are independently verified; Git/CI capture and exact global installation remain.
**Current phase:** Maintenance / Trello Work CLI 0.1.0 capture and installation
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Commit and push the exact verified `0.1.0` snapshot, confirm required GitHub Actions pass, then globally install that exact local package and run `work --help`.

## Why This Is Next

- Package identity, changelog, packed boundary, package/root gates, and independent review pass.
- Exact Git/CI provenance is required before global installation.

## Requirements

- [ ] Commit only task-owned version/changelog, work-item, planning, and `NEXT.md` paths.
- [ ] Push `master` and verify `origin/master` contains the exact commit.
- [ ] Confirm Quality and Portability CI pass for that SHA.
- [ ] Globally install `@jz/ai-arsenal-trello-work-cli@0.1.0` from that exact checkout.
- [ ] Verify global package registration and read-only `work --help`.

## Blockers / Approval

- Do not install before green CI.
- Do not publish or access Trello during installation verification.
- Live TestingBoard workbook execution remains separate.

## Done When

- Exact commit is remote and CI-green; global pnpm reports version `0.1.0`; `work --help` exits successfully without credentials.

## After This

- Resume the separately authorized TestingBoard onboarding workbook from a fresh preflight.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/work-items/2026-07-28-version-trello-work-cli/verification.md`
- `docs/work-items/2026-07-28-version-trello-work-cli/reconciliation.md`
