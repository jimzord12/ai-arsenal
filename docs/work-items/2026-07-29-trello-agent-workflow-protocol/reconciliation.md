Work item: 2026-07-29-trello-agent-workflow-protocol
Artifact: reconciliation
Revision: 1
Prerequisites: verification@1
Status: passed

# Resulting state

The package-owned `packages/trello-work-cli/assets/agent-workflow-protocol.md` now provides the verified normative Trello-backed development workflow for Claude Code, Codex, Pi, and Hermes Agent. It defines Trello lifecycle authority, the Superpowers engineering-practice boundary, all normal and recovery transitions, lightweight evidence, recovery-aware non-atomic claiming, completion judgment, human archival, four proposed follow-on skills, and their verification strategy. The file is repository source only; package packing, offline CLI docs integration, release, installation, Trello mutation, and skill implementation remain unchanged and separately gated.

## Canonical-plan updates

- Update Current Verified State with the accepted and verified protocol location, authority model, lifecycle decisions, four proposed skills, cross-harness boundary, and deferred package integration.
- Update the architecture responsibility boundary and testing/verification state to reference the protocol.
- Add the completed protocol-design maintenance item to the phase map and resulting-state section.
- Carry forward remaining risks: non-atomic claim allocation, absent native Superpowers support for Hermes, production-board lifecycle mismatch, and unimplemented/unverified follow-on skills.
- Update Current Open Decisions and Immediate Next Step so a separately bounded skill-implementation work item is next; do not register or implement it automatically.

## NEXT.md update

Clear the active work item and pipeline step to `none`. Replace the selected design objective with the verified protocol result and one next action: create a separate bounded work item for the four proposed cross-harness skills only when the user chooses to continue. Preserve explicit exclusions for package integration, releases, installation, production-board migration, Git Bash remediation, source deletion, and human card archival.

## Risks

- Trello claim sequencing remains recovery-aware rather than atomic; stronger production allocation needs a separate backend/design.
- Current Superpowers upstream documentation does not list native Hermes support; Hermes must use equivalent engineering-practice skills without claiming native integration.
- The Greek Essence production board does not match the canonical seven-list lifecycle and remains unapproved for migration.
- The four proposed skills are protocol designs, not implemented or cross-harness verified artifacts.
- The protocol is not yet part of the package manifest or `jz-trello-flow docs` and must not be assumed present in a packed installation.

## Next action

When authorized, capture a separate bounded monorepo work item to implement and verify `trello-work-orchestrator`, `trello-work-design`, `trello-work-deliver`, and `trello-work-recover` across Claude Code, Codex, Pi, and Hermes Agent without changing the CLI package boundary or production Trello state unless separately approved.
