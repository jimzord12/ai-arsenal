# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-29
**Project:** AI Arsenal monorepo
**State:** Trello Flow CLI attachment metadata and explicit safe downloads are independently verified; Git/CI capture remains.
**Current phase:** Maintenance / Trello Work Unit attachment retrieval
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Commit and push the exact verified Trello attachment snapshot, prove `HEAD` equals `origin/master`, and confirm Quality and Portability pass for that full SHA.

## Why This Is Next

- Every `jz-trello-flow get` result now reports `attachmentCount` and complete normalized attachment metadata.
- Explicit `--attachments-dir <directory>` downloads uploaded files with authenticated binary-safe transport, safe lexical destination handling, deterministic duplicate naming, atomic no-overwrite creation, and truthful partial-failure recovery.
- External links remain metadata-only; default `get` performs no local file writes.
- Focused tests, 251 package tests, strict packed-artifact validation, root checks, workflow validators, and independent review pass.

## Requirements

- [ ] Commit only the approved attachment implementation, tests, docs, planning, and work-item artifacts.
- [ ] Push `master` and verify fetched `origin/master` matches the exact full commit SHA.
- [ ] Confirm Quality and Portability complete successfully for that SHA.

## Blockers / Approval

- No blocker prevents Git/CI capture.
- Do not publish, mutate Trello, or change the global installation as part of this action.
- A versioned release and replacement of globally installed `0.2.0` require a separate Changesets operation and explicit installation approval.

## Done When

- The exact verified commit is on `origin/master`, Quality and Portability pass for that SHA, and the worktree is clean.

## After This

- Decide whether to create a versioned private release and explicitly authorize replacement of the global installation.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/work-items/2026-07-29-fetch-trello-card-attachments/verification.md`
- `docs/work-items/2026-07-29-fetch-trello-card-attachments/reconciliation.md`
