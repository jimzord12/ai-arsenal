Work item: 2026-07-29-trello-agent-workflow-protocol
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`, especially sections 4.1, 7.6, 8, 19, 20, and 24
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `.agents/skills/capture-monorepo-change/SKILL.md`
- `.agents/skills/orient-monorepo-change/SKILL.md`
- `packages/trello-work-cli/README.md`
- `packages/trello-work-cli/assets/work-guide.md`
- Direct user decisions recorded in `request.md`

## Repository snapshot

- Repository root: `C:\Users\jimzord12\Documents\GitHub\ai-arsenal`.
- Branch: `master`.
- HEAD at orientation: `cfd0c2841b76301430f4e6a34b7de850abafff7c`, matching `origin/master` with divergence `0 0`.
- Pre-existing worktree change: `NEXT.md`, deliberately reconciled to select this objective. Capture added only the active registration and `request.md`.
- `node scripts/validate-monorepo-work-item.mjs --work-item none --json` passed before capture; the captured item validates and routes to `orient-monorepo-change`.
- Repository and globally installed package versions are `@jz/ai-arsenal-trello-work-cli@0.3.0`.
- Native Windows `jz-trello-flow docs --list` and read-only Trello commands pass. Direct Git Bash invocation reproduces the already-recorded broken global shim and is not silently added to this work item's scope.
- Read-only Trello discovery found three accessible boards. `TestingBoard` has the seven open canonical lists and only completed test Work Units. The production Greek Essence board uses a noncanonical lifecycle (`inbox`, `Ready`, `Paused`, `Cancelled`, `Blocked`, `Completed`) and normal Work Unit listing fails before mutation because canonical `Inbox` is absent.
- No local Superpowers installation was found under the inspected Claude Code, Codex, Pi, OpenCode, or Hermes locations. Upstream `obra/superpowers` main was inspected at `44c9b2d6e889982ac18c27d05a19fefe335194e1`; its README documents Claude Code, Codex App/CLI, and Pi support plus brainstorming, planning, TDD, execution, review, debugging, and verification practices. It does not list Hermes Agent as a supported harness.

## Relevant files

- `packages/trello-work-cli/src/cli.ts` and related command modules: public command routing and mutation options.
- `packages/trello-work-cli/src/schema.ts` and parser/domain modules: canonical Work Unit metadata and section authority.
- `packages/trello-work-cli/src/service.ts` and Trello client modules: version checks, operation replay, transition, reconciliation, and read-back behavior.
- `packages/trello-work-cli/README.md`: package responsibility and safety boundary.
- `packages/trello-work-cli/assets/work-guide.md`: version-matched command, lifecycle, recovery, and agent workflow guidance.
- `packages/trello-work-cli/assets/work-unit.schema.json`: portable Work Unit schema.
- `packages/trello-work-cli/src/*.test.ts` and `packages/trello-work-cli/test/*.test.ts`: existing offline behavior and packed-boundary verification seams.
- `.agents/skills/`: current repository-scoped skill packaging and validation conventions.
- `scripts/validate-monorepo-work-item.mjs` and its test: repository artifact-pipeline state machine.
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`, `NEXT.md`, and `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`: current project truth and approval boundaries.
- Upstream Superpowers `README.md` and `skills/`: external capability and responsibility evidence, referenced by exact inspected commit rather than copied into this repository during orientation.

## Risks

- Trello does not provide atomic conditional writes, and the current CLI does not combine owner metadata update and status transition into one transaction. Claiming must be described as a recovery-aware multi-step postcondition, not an atomic lock.
- Operation IDs provide replay/recovery identity but cannot make arbitrary cross-command sequences atomic.
- Harnesses expose different skill/plugin/bootstrap mechanisms. Hidden hooks, tool names, or Superpowers installation assumptions would break portability.
- Hermes Agent is not listed by current Superpowers upstream support, so Hermes guidance must preserve the responsibility boundary without claiming native plugin availability.
- The current CLI downloads existing attachments but does not upload them. Protocol evidence cannot require CLI attachment upload.
- The production Greek Essence board does not match the canonical lifecycle. This work item cannot imply authorization to initialize or migrate it.
- Over-specifying evidence or Superpowers artifact names would create ceremony and couple the protocol to a changing external plugin; under-specifying acceptance and read-back invariants could permit unsupported completion or unsafe retries.
- Human archival means Done-card accumulation and archival cadence remain a human operating concern, not an agent automation guarantee.

## Open questions

None. The feature-design interview resolved lifecycle authority, claiming postconditions, evidence placement, completion judgment, recovery behavior, and human archival ownership. Exact protocol paths, skill names, and verification commands are planning outputs constrained by those decisions.
