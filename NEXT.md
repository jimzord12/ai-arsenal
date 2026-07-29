# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-29
**Project:** AI Arsenal monorepo
**State:** The package-owned Trello workflow protocol, four canonical Open Agent Skills, and `jz-trello-flow skills install` are implemented, independently verified, committed, pushed, and green in CI.
**Current phase:** Await the next bounded request
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Await the next explicit bounded request and route it through `orchestrate-monorepo-work`.

## Why This Is Next

- Passed `verification@3` covers focused behavior, package gates, the pinned official validator, the actual packed consumer, root gates, workflow validation, and adversarial Git/Python isolation.
- Reconciliation records the locked installer decisions as current delivered product truth.
- Commit `251d0ff92c7cf46371d139045450726359bae6dc` is present on `origin/master`; Quality and Portability CI passed.

## Delivered Product Decisions

- Public command: `jz-trello-flow skills install`.
- Install into the target repository's `.agents/skills/` directory.
- Every run replaces the four CLI-managed `trello-work-*` skill directories with the versions bundled in the running CLI; no merge or version-migration logic.
- Never modify unrelated skill directories.
- Mark installed files as managed and replaceable by the CLI.
- Prepare and validate the complete skill set before replacing targets so failed preparation cannot leave a partial installation.
- Support `--dry-run` and report installed/replaced targets.
- Include real packed-artifact coverage proving the skills ship and can be installed from the package.

## Requirements

- [x] Preserve the four repository-owned canonical skill sources.
- [x] Add and verify the package assets, installer, packed boundary, help, and offline documentation.
- [x] Verify fresh/replacement/repeated/dry-run/failure-safe installation, unrelated-skill preservation, and real packed-consumer execution.
- [x] Pass independent verification, package/root gates, and workflow reconciliation.
- [x] Commit and push the exact attributable snapshot.
- [x] Confirm the resulting `master` CI runs.

## Blockers / Escalation

- No blocker is known.
- No blocker remains for the delivered installer snapshot.

## Done When

- The reviewed commit is present on `origin/master`, local `master` matches it, and the worktree is clean.

## After This

Await the next explicit bounded request and route it through `orchestrate-monorepo-work`.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `packages/trello-work-cli/package.json`
- `packages/trello-work-cli/assets/agent-workflow-protocol.md`
- `packages/trello-work-cli/assets/agent-skills-adapters.md`
- `.agents/skills/trello-work-orchestrator/SKILL.md`
- `.agents/skills/trello-work-design/SKILL.md`
- `.agents/skills/trello-work-deliver/SKILL.md`
- `.agents/skills/trello-work-recover/SKILL.md`
