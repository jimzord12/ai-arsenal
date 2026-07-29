# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-29
**Project:** AI Arsenal monorepo
**State:** The package-owned Trello workflow protocol, four canonical Open Agent Skills, and `jz-trello-flow skills install` are implemented, independently verified, and reconciled locally.
**Current phase:** Deliver the verified Trello CLI skills-installer snapshot
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Commit and push the exact verified implementation and reconciliation snapshot, then confirm the resulting `master` CI runs.

## Why This Is Next

- Passed `verification@3` covers focused behavior, package gates, the pinned official validator, the actual packed consumer, root gates, workflow validation, and adversarial Git/Python isolation.
- Reconciliation records the locked installer decisions as current delivered product truth.
- Git delivery and resulting `master` CI confirmation are the only remaining steps for this snapshot.

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
- [ ] Commit and push the exact attributable snapshot.
- [ ] Confirm the resulting `master` CI runs.

## Blockers / Escalation

- No blocker is known.
- Do not publish, release, globally install, install into a non-disposable consumer, call Trello, or perform dangerous deletion as part of delivery.

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
