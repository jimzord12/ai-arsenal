Work item: 2026-07-27-trello-work-cli-live-e2e
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`, especially sections 4.1, 7.6, and 8
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `.agents/skills/capture-monorepo-change/SKILL.md`
- `.agents/skills/orient-monorepo-change/SKILL.md`
- `packages/trello-work-cli/README.md`
- No nearer `packages/trello-work-cli/AGENTS.md` exists.

## Repository snapshot

- Branch: `master` at `ee51e795bcacb54463815bb5ceb14bbac1505d3d`.
- Remote: `origin` is `https://github.com/jimzord12/ai-arsenal.git`; after `git fetch --prune origin`, local `HEAD` and `origin/master` have divergence `0 0` and resolve to the same commit.
- GitHub CLI: active keyring-authenticated account `jimzord12`; `GH_TOKEN` was unset for the check.
- Worktrees: only the repository root worktree is registered.
- Pre-capture status contained a user-provided modification to `NEXT.md` describing live Trello E2E as the next action. Capture preserved that content and changed only the active registration fields. Current task-owned paths are `NEXT.md` registration changes and `docs/work-items/2026-07-27-trello-work-cli-live-e2e/`.
- Workflow preflight: `node scripts/validate-monorepo-work-item.mjs --current --json` exited 0 with a valid inactive registration. Post-capture validation exited 0 and routed to `orient-monorepo-change`.
- Configuration presence check, with values suppressed: `TRELLO_API_KEY`, `TRELLO_API_TOKEN`, and `TRELLO_API_SECRET` are set in the current process environment. `TRELLO_BOARD_ID`, all six status-list variables, `TRELLO_TRANSITIONS_JSON`, and `TRELLO_RECONCILE_SOURCE` are unset.
- No Trello API request or live mutation was performed.
- Existing package commands are `format`, `lint`, `typecheck`, `test`, `pack`, and `validate`; current Jest discovery covers `src/**/*.test.ts` and `test/**/*.test.ts`.

## Relevant files

- `packages/trello-work-cli/package.json`: private Bun executable package, current test and validation commands, and packed-file boundary.
- `packages/trello-work-cli/README.md`: configuration variables, credential precedence, safety boundaries, and offline development commands.
- `packages/trello-work-cli/src/config.ts`: process-environment precedence, explicit Hermes env loading, board/list/transition/reconciliation configuration, and credential redaction.
- `packages/trello-work-cli/src/trello-client.ts`: live REST transport, 15-second timeout, read and mutation endpoints, error mapping, ambiguous mutation recovery data, and secret redaction.
- `packages/trello-work-cli/src/cli.test.ts`: real Bun process seam that currently strips all ambient `TRELLO_*` variables and remains offline.
- `packages/trello-work-cli/src/create.test.ts` and the other `src/*.test.ts` suites: injected-client offline coverage for verified writes, replay, drift, partial recovery, transitions, reconciliation, and checklists.
- `docs/work-items/2026-07-26-trello-work-unit-cli/verification.md`: prior offline verification evidence; explicitly records no live Trello access.
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`: records 159 offline tests and identifies live integration as a separate explicit gate.

## Risks

- Ambient credentials are present but board/list allowlisting is absent; live access before exact identifier confirmation could reach an unintended board.
- The package's process tests deliberately remove ambient Trello configuration, so a live harness needs an explicit opt-in seam that cannot run accidentally during normal `pnpm test` or CI.
- Trello mutations can have ambiguous outcomes; cleanup must use durable operation identity and read-back evidence rather than blind retries.
- The Trello client exposes no card-delete/archive method in the inspected boundary, so disposable-resource cleanup capability and leak reporting need to be resolved during scope and planning.
- Server-assigned `idShort` values are board-global and non-resettable; assertions cannot assume a fixed `WU-N`.
- Transition and reconciliation behavior fails closed without explicit policy configuration.
- Credentials and credential-bearing URLs must remain absent from logs, fixtures, artifacts, reports, and Git.

## Open questions

- What exact Trello testing board ID is authorized?
- What exact list IDs are authorized for Inbox, Ready, In Progress, Review, Blocked, and Done?
- Is the current process environment the authorized credential source, or must live tests use an explicit `--hermes-env` path?
- What exact transition graph is authorized for the test board?
- Should reconciliation use `description` or `list` as its source of truth?
- May the harness archive/delete only cards and checklists that it creates, and which cleanup operation is authorized for leaked-resource recovery?
