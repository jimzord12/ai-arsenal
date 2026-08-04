# AI Arsenal Handoff

## Project location

`C:\Users\jimzord12\Documents\GitHub\ai-arsenal`

## High-level objective

Maintain and extend the AI Arsenal monorepo—especially its Workflow v2
safety/delivery system and private CLI packages—through small,
evidence-backed GitHub issue work items.

## Current state

- GitHub issue #13, “Resolve Workflow V2 authority for routine global CLI
  replacement,” is complete locally.
- Its policy changes align current Workflow v2 authority: a fully bounded CLI
  behavior release may replace the global pnpm package automatically only after
  the exact reviewed artifact commit is pushed and required CI passes.
- Dangerous deletion, registry publication, source deletion, destructive Git
  operations, and unrelated external mutations still require separate authority.
- No package release, global replacement, rollback, publication, or live Trello
  mutation occurred for #13.
- `NEXT.md` has no active work item and identifies issue #12 as next.
- The working tree has uncommitted changes from the #14 closure/context update,
  issue queue addition, and completed #13 work. Preserve and include them; do
  not discard or overwrite them.

## Read first

1. `AGENTS.md`
2. `NEXT.md`
3. `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
4. `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
5. `git status --short` and recent commits
6. GitHub issue #12:

   ```powershell
   gh issue view 12 --repo jimzord12/ai-arsenal
   ```

Then run:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item none --json
```

## Next work

Start issue #12: “Enforce Workflow V2 delivery evidence before CLI closure.”

Use the normal Workflow v2 sequence:

```text
orchestrate-monorepo-work
→ define-monorepo-change
→ implement-monorepo-change
→ review-monorepo-change
→ verify-monorepo-change
→ deliver-monorepo-change
```

Issue #12 should make CLI behavior delivery fail closed until required evidence
is durably recorded: artifact commit, remote equality, CI, package/version,
tarball checksum, global replacement/install proof, installed-shim smoke,
rollback readiness/outcome, and clean-worktree evidence. Ordinary
documentation/policy work must remain exempt.

## Relevant #13 evidence

- Focused guard: `scripts/validate-global-replacement-authority.test.mjs`
- Registered under `test:workflow` in `package.json`
- Updated authority sources:
  - `AGENTS.md`
  - `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
  - `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
  - `docs/workflow/templates/work-item/work-item.md`
  - `.agents/skills/orchestrate-monorepo-work/SKILL.md`
  - `.agents/skills/deliver-monorepo-change/SKILL.md`
- Work item:
  `docs/work-items/2026-08-04-resolve-global-cli-replacement-authority/work-item.md`

## Verification observed

For #13, these commands passed:

```powershell
pnpm check
node scripts/validate-living-workflow.mjs
node scripts/validate-monorepo-work-item.mjs --work-item none --json
git diff --check
```

`pnpm check` reported 121 workflow tests: 119 passed and 2 expected skips.

## Advice

- GitHub is the issue-system authority; `NEXT.md` is a concise routing view and
  execution queue.
- Keep canonical-plan headers consistent with the active workflow, but prefer
  stable “in progress” wording when a stage-specific phrase would invalidate a
  review snapshot.
- Do not ask for routine stage permission. Continue autonomously unless a
  dangerous operation or a real hard prerequisite blocks progress.
- The user explicitly decided not to require a separate-agent reviewer for the
  current workflow. Use the repository’s current snapshot-bound review process
  unless the user reintroduces that requirement.
- Do not version, pack, globally install, publish, or perform external mutation
  unless the active issue explicitly requires it.
- Do not use destructive Git or filesystem commands without fresh explicit
  confirmation.
