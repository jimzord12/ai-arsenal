Work item: 2026-07-28-ignore-archived-lists-in-canonical-resolution
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`, especially Current Verified State, Canonical Architecture §§7.6–7.8, Monorepo Work-Item Pipeline §8, Trello Intake and In Design Lifecycle maintenance update, Current Risks, Current Open Decisions, and Immediate Next Step
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `.agents/skills/capture-monorepo-change/SKILL.md`
- `.agents/skills/orient-monorepo-change/SKILL.md`
- No nearer `packages/trello-work-cli/AGENTS.md` exists in the live repository; the user-requested path was checked and is absent.

## Repository snapshot

- Branch: `master`.
- Commit: `e8d5bc2f6808ac3146f487998283444d94533e87`.
- After `git fetch origin --prune`, `HEAD`, `master`, and `origin/master` all resolve to that commit.
- Remote: `origin` is `https://github.com/jimzord12/ai-arsenal.git`; GitHub CLI keyring authentication is available with `GH_TOKEN` unset.
- Pre-existing state: `NEXT.md` was intentionally modified and uncommitted. Capture added this work-item directory and changed only the active registration fields in that existing continuation.
- Workflow validation passed for no active item before capture and now passes with next skill `orient-monorepo-change`.
- Relevant package commands are `pnpm --filter @jz/ai-arsenal-trello-work-cli format`, `lint`, `typecheck`, `test`, and `validate`; the root pipeline and CI remain required integration gates.
- Read-only TestingBoard verification used board ID `6a16bbf1fea5389eb39636b7` and found zero cards on open lists, one open `Done` (`6a68ca0b31bd0c5433800097`), and one archived namesake `Done` (`6a16bbf1fea5389eb396372e`). No Trello mutation occurred.

## Relevant files

- `packages/trello-work-cli/src/board.ts`: name-based canonical mapping currently considers every board list, while explicit override lookup resolves by ID and board ownership.
- `packages/trello-work-cli/src/list-management.ts`: guarded workflow initialization currently considers every namesake; list CRUD/replay and audit paths intentionally support closed lists.
- `packages/trello-work-cli/src/transition.ts`: transitions consume resolved configured list IDs and move cards directly to the target mapping.
- `packages/trello-work-cli/src/cli.ts`: workflow initialization and canonical mapping are wired into board-dependent commands.
- `packages/trello-work-cli/src/read-commands.ts`: existing diagnostics already distinguish open-list membership in some reads.
- `packages/trello-work-cli/src/trello-client.ts`: `listBoardLists` deliberately fetches `filter=all`, and `getList` supports explicit list-ID reads.
- `packages/trello-work-cli/src/board.test.ts`: focused canonical mapping coverage.
- `packages/trello-work-cli/src/list-management.test.ts`: workflow initialization, explicit list lifecycle, replay, ambiguity, and open/closed listing coverage.
- `packages/trello-work-cli/src/transition.test.ts`: focused transition behavior and target-list coverage.
- `packages/trello-work-cli/src/read-commands.test.ts`: diagnostic/open-list behavior coverage.
- `packages/trello-work-cli/test/live-support.ts` and `test/live-trello.e2e.test.ts`: gated TestingBoard preflight and lifecycle evidence; live execution remains prohibited for this stage.
- `packages/trello-work-cli/README.md`, `src/docs.ts`, `src/command-catalog.ts`, and `assets/work-guide.md`: user-facing workflow and list semantics that may need consistency checks.

## Risks

- Filtering the Trello client globally would break explicit archived-ID reads, close replay, cleanup verification, and audit.
- Filtering only one name-resolution path could leave initialization, diagnostics, card placement, or transitions able to select archived lists.
- Explicit configured list IDs currently accept archived lists for recovery-oriented behavior; active mutation commands must not accidentally treat that recovery support as authorization to target an archived canonical list.
- Archived Trello lists can still contain cards whose card-level `closed` field is false, so board-card counts must be interpreted against open-list state.
- Live TestingBoard mutation, global installation, packing/distribution, and workbook retry are outside the current pre-implementation stages and remain gated.
- The canonical plan's Immediate Next Step predates the newly captured bug-fix work item; reconciliation, not orientation, owns updating that current-truth wording.

## Open questions

None.
