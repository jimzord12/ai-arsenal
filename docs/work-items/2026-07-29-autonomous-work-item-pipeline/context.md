Work item: 2026-07-29-autonomous-work-item-pipeline
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Current state

The pipeline already provides effective request, context, contract, plan, digest, implementation, verification, and reconciliation artifacts. Its plan stage and validator currently force explicit human approval before every implementation, while several skills separately prohibit routine Git and external actions without approval.

# Desired authority

- Routine bounded work proceeds autonomously through every pipeline stage.
- `approval.md` remains as a digest-bound authorization/audit artifact for compatibility.
- The agent may record autonomous authorization when no escalation condition exists.
- Human approval is required only immediately before dangerous deletion or a similarly irreversible data-loss operation.
- Missing credentials, access, mandatory external state, contradictory authority, or an impossible requirement are blockers to escalate honestly; agents must not mock away required E2E coverage.
- Routine Git commit/push and recoverable, scoped operations do not create redundant approval stops.

# Applicable authorities

`AGENTS.md`, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, repository workflow skills/templates, validator/tests, and the package-owned Trello agent protocol.
