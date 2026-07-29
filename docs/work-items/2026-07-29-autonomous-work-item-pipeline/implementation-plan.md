Work item: 2026-07-29-autonomous-work-item-pipeline
Artifact: plan
Revision: 1
Prerequisites: contract@1
Status: ready

# Preconditions

Preserve all existing uncommitted protocol, skills, review evidence, and documentation correction work. Do not mutate Trello or delete sources.

# Tasks

1. Update `AGENTS.md` and `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md` to make autonomous progression normative and narrow escalation to dangerous deletion/data loss, unavailable hard prerequisites, contradictory authority, or impossible requirements.
2. Update `scripts/validate-monorepo-work-item.mjs` so a plan without `approval.md` routes to `record-monorepo-approval` with no routine blocker and so digest-bound authorization may be recorded by `user` or `autonomous-agent`.
3. Update validator tests for autonomous routing, autonomous authorization, legacy user approval, stale digest rejection, revisions, and full lifecycle behavior.
4. Update `docs/workflow/templates/work-item/approval.md` and the monorepo stage skills responsible for planning, authorization, implementation, verification, and reconciliation boundaries.
5. Update `packages/trello-work-cli/assets/agent-workflow-protocol.md` so scoped plan/Work Unit authority avoids redundant prompts while preserving guarded mutation, recovery, and human-only archival.
6. Reconcile `NEXT.md` and `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`.

# Verification

- `node --test scripts/validate-monorepo-work-item.test.mjs`
- `node scripts/validate-living-workflow.mjs`
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-autonomous-work-item-pipeline --json`
- Relevant Prettier checks
- `git diff --check`
- Independent review of governance semantics and regression risk

# Boundaries

No destructive deletion, release, installation, credential changes, production Trello mutation, or history rewriting. Routine local implementation and verification proceed autonomously.
