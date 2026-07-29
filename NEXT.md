# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-29
**Project:** AI Arsenal monorepo
**State:** Trello Flow CLI attachment metadata and explicit safe downloads are merged and CI-green; release and global installation remain separate.
**Current phase:** Maintenance / Trello Work Unit attachment retrieval
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Decide whether to create a versioned private release and explicitly authorize replacement of the globally installed `0.2.0` package.

## Why This Is Next

- Every `jz-trello-flow get` result now reports `attachmentCount` and complete normalized attachment metadata.
- Explicit `--attachments-dir <directory>` downloads uploaded files with authenticated binary-safe transport, safe lexical destination handling, deterministic duplicate naming, atomic no-overwrite creation, and truthful partial-failure recovery.
- External links remain metadata-only; default `get` performs no local file writes.
- Focused tests, 251 package tests, strict packed-artifact validation, root checks, workflow validators, and independent review pass.
- Commit `af5345cbd829223ea019d4e8d831239a539b98f5` is on `master` and `origin/master`; Quality run `30434688417` and Portability run `30434688480` passed for that exact SHA.

## Requirements

- [ ] Confirm whether this additive public CLI feature should receive the next SemVer release.
- [ ] If approved, use Changesets to version the private package and verify the exact packed artifact.
- [ ] Ask explicitly before replacing the global installation with that exact CI-green release.

## Blockers / Approval

- No implementation or Git/CI blocker remains.
- Do not publish, mutate Trello, or change the global installation without explicit authorization.

## Done When

- The user either authorizes a bounded private release/install operation or defers it explicitly.

## After This

- Resume the next explicitly selected bounded monorepo change.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/work-items/2026-07-29-fetch-trello-card-attachments/verification.md`
- `docs/work-items/2026-07-29-fetch-trello-card-attachments/reconciliation.md`
