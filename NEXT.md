# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-29
**Project:** AI Arsenal monorepo
**State:** Trello Flow CLI `0.3.0` release metadata is verified; Git/CI, exact global installation, and read-only live capture remain.
**Current phase:** Maintenance / Trello Work Unit attachment release
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Commit and push the exact verified `0.3.0` release snapshot, require Quality and Portability for its full SHA, then pack/install that exact commit and rerun the read-only TestingBoard attachment workbook.

## Why This Is Next

- Changesets generated the correct additive minor release from `0.2.0` to `0.3.0`.
- Changelog, package manifest, 251 package tests, strict packed validation, root gates, workflow validators, and independent release review pass.
- The global package remains the rollback-safe `0.2.0` until exact-SHA CI passes.

## Requirements

- [ ] Commit/push only the verified release and work-item snapshot; prove fetched `origin/master` equals the full release SHA.
- [ ] Require Quality and Portability to pass for that exact SHA.
- [ ] Pack from the clean exact commit, record tarball SHA-256, inspect its manifest/files, and install that exact tarball globally.
- [ ] Verify native Windows `jz-trello-flow` reports `0.3.0` behavior and exposes `--attachments-dir`.
- [ ] Run metadata-only, binary-download/hash, and no-overwrite checks only on TestingBoard/card `6a691ff583597d8cfdd0c780`.

## Blockers / Approval

- No blocker remains; the user explicitly authorized versioning, global replacement, commit, and push.
- Do not publish, mutate Trello, access another board, delete rollback sources, or remediate Git Bash shims.

## Done When

- Exact Git/CI, tarball checksum, global `0.3.0`, native help, and read-only live attachment evidence all pass; final current-truth docs are committed/pushed and CI-green.

## After This

- Resume the next explicitly selected bounded monorepo change.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/work-items/2026-07-29-release-trello-attachments/verification.md`
- `docs/work-items/2026-07-29-release-trello-attachments/reconciliation.md`
