Work item: 2026-07-29-autonomous-work-item-pipeline
Artifact: implementation
Revision: 1
Prerequisites: contract@1,plan@1,approval@1
Status: ready

# Summary

Converted the monorepo work-item pipeline from routine human-permission gating to autonomous digest authorization while preserving all eight stages, artifact prerequisites, exact-plan SHA-256 binding, revision invalidation, verification, and reconciliation.

# Key behavior

- Plans without `approval.md` now route to `record-monorepo-approval` with no blocker.
- The authorization artifact accepts `Approved by: autonomous-agent` and preserves legacy/direct `user` records.
- Agents stop for direct approval only before dangerous deletion or similarly irreversible data loss.
- Missing mandatory credentials/access, contradictory authority, impossible requirements, and unavailable hard prerequisites are escalated honestly.
- Required live/E2E evidence cannot be replaced with mocks merely to avoid escalation.
- Routine contract decisions, plan revisions, implementation, review repair, commit, and push do not trigger permission prompts.
- The Trello protocol uses Work Unit/repository scope as authority and preserves human-only final archival.

# Changed governing surfaces

- `AGENTS.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/workflow/WORKFLOW_OVERVIEW.md`
- `docs/workflow/SKILL_EVALUATION_SCENARIOS.md`
- `docs/workflow/templates/work-item/approval.md`
- `docs/workflow/templates/work-item/change-contract.md`
- `scripts/validate-monorepo-work-item.mjs`
- `scripts/validate-monorepo-work-item.test.mjs`
- `.agents/skills/orchestrate-monorepo-work/SKILL.md`
- `.agents/skills/scope-monorepo-change/SKILL.md`
- `.agents/skills/plan-monorepo-change/SKILL.md`
- `.agents/skills/record-monorepo-approval/SKILL.md`
- `.agents/skills/implement-monorepo-change/SKILL.md`
- `.agents/skills/request-monorepo-revision/SKILL.md`
- `.agents/skills/reconcile-monorepo-change/SKILL.md`
- `.agents/skills/reconciling-living-plan/SKILL.md`
- `.agents/skills/executing-living-plan-phase/SKILL.md`
- `.agents/skills/initializing-living-plan-workflow/assets/AGENTS.template.md`
- `.agents/skills/trello-work-deliver/SKILL.md`
- `.agents/skills/trello-work-design/SKILL.md`
- `.agents/skills/trello-work-orchestrator/SKILL.md`
- `.agents/skills/trello-work-recover/SKILL.md`
- `packages/features-cli/AGENTS.md`
- `packages/trello-work-cli/assets/agent-workflow-protocol.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `NEXT.md`

# Additional completed correction

The prior bounded work item `2026-07-29-fix-deprecated-draft-create-docs` replaced the two remaining deprecated creation examples with `draft create`; 251 package tests passed.

# External effects

No source deletion, release, installation, credentials, production Trello mutation, or destructive Git operation occurred during implementation.
