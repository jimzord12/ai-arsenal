Work item: 2026-07-29-fetch-trello-card-attachments
Artifact: reconciliation
Revision: 1
Prerequisites: verification@1
Status: passed

# Resulting state

The verified Trello Flow CLI `get` result now always includes `attachmentCount` and complete normalized attachment metadata. Explicit `--attachments-dir <directory>` downloads uploaded files with authenticated binary-safe transport, safe lexical destination handling, deterministic duplicate naming, atomic no-overwrite creation, metadata-only external links, and truthful partial-failure recovery. JSON/text output, offline docs, package contents, and tests are synchronized.

## Canonical-plan updates

Record the additive attachment contract and its verification in Current Verified State, test architecture, Trello maintenance state, risks, open decisions, and Immediate Next Step. Preserve the two Low independent-review observations as optional hardening rather than failed acceptance criteria.

## NEXT.md update

Clear the active work-item registration after reconciliation. Set the exact next action to commit and push the verified snapshot and confirm Quality and Portability CI for the exact SHA. Keep global installation separately approval-gated.

## Risks

- Symlink/junction destination components are not explicitly rejected; lexical containment assumes the explicitly selected destination is trusted local configuration.
- Atomic `wx` creation prevents overwrite if a destination appears after preflight, but there is no dedicated race regression and already-downloaded bytes/network work may be wasted before the truthful partial failure.
- Global installation remains at `0.2.0` without this uncommitted feature until a future versioned release and explicit installation approval.

## Next action

Commit and push the exact verified snapshot, confirm `HEAD` equals `origin/master`, and require Quality and Portability to pass for that full SHA.
