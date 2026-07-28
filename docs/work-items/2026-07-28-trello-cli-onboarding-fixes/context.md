Work item: 2026-07-28-trello-cli-onboarding-fixes
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` section 8
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `.agents/skills/orchestrate-monorepo-work/SKILL.md`
- `.agents/skills/capture-monorepo-change/SKILL.md`
- `.agents/skills/orient-monorepo-change/SKILL.md`

No nearer `AGENTS.md` exists under `packages/trello-work-cli`.

## Repository snapshot

- Branch: `master`
- Baseline commit and `origin/master`: `eacd7613e63d34111e2d002eb8b742004f499fff`
- Baseline working tree was clean before this work item; current changes are the registered request/context workflow artifacts and `NEXT.md` routing.
- Relevant package commands: `pnpm --filter @jz/ai-arsenal-trello-work-cli format`, `lint`, `typecheck`, `test`, and `validate`.
- The package baseline records 207 offline tests across 18 suites plus a separately authorized live suite.

## Relevant files

- `packages/trello-work-cli/src/cli.ts`: `mutationCliResult` accepts planned mutation output only when it contains `plan` or `draft`.
- `packages/trello-work-cli/src/update.ts`: metadata/description dry runs return `outcome: planned` with `proposed`, not `plan` or `draft`.
- `packages/trello-work-cli/src/cli.test.ts` and `src/update.test.ts`: existing mutation-output and update behavior coverage.
- `packages/trello-work-cli/src/read-commands.ts`: `listWorkUnits` normalizes every board card before filtering, so any malformed/non-Work-Unit card aborts the complete listing.
- `packages/trello-work-cli/src/read-commands.test.ts`: existing single-card invalid-remote coverage and list-filter coverage.
- `packages/trello-work-cli/src/work-unit.ts`: `Open Questions` is valid only while status is `inbox`.
- `packages/trello-work-cli/test/fixtures/valid-draft.md`: the copied onboarding fixture contains `Open Questions`.
- `packages/trello-work-cli/assets/work-guide.md` and `README.md`: public CLI behavior and safety documentation.
- The exact onboarding workbook text is present in the user request/conversation but no matching repository workbook file currently exists.
- Prior credential-free run evidence showed `MUTATION_INVALID_OUTCOME` for metadata dry-run, `INVALID_REMOTE_WORK_UNIT` during label-filtered listing with another malformed card present, and transition rejection because the copied fixture retained `Open Questions`.

## Risks

- Changing list behavior may alter fail-closed handling of malformed Work Unit cards and must distinguish ordinary Trello cards from corrupt cards that claim Work Unit identity.
- Any live verification must remain allowlisted to `TestingBoard` ID `6a16bbf1fea5389eb39636b7`, keep credentials process-environment-only, and avoid recreating unnecessary cards after unclear outcomes.
- The workbook must not permit a draft that is structurally valid only in Inbox to be used unchanged for later transitions.
- The user reports that TestingBoard now contains only the six empty canonical lists, so prior run-owned card/list recovery is no longer required.

## Open questions

- The repository has no existing onboarding workbook file matching the supplied exercise. Scoping must select a durable repository location or explicitly define another deliverable form for the corrected workbook.
- Whether malformed/non-Work-Unit cards should be skipped, separately reported, or remain fatal during `work list` requires contract-level clarification from existing CLI intent and proportional safety expectations.
