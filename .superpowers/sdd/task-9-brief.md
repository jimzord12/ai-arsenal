### Task 9: Write `verify-monorepo-change`

**Files:**

- Create: `.agents/skills/verify-monorepo-change/SKILL.md`
- Create: `.agents/skills/verify-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: contract, plan, implementation report, changed worktree, and the
  contract's stated verification requirements.
- Produces: `verification.md` with prerequisites `contract@1, plan@1,
implementation@1` and status `passed` or `failed`.

- [ ] **Step 1: Build the verification matrix from the contract.**

  Map every acceptance criterion to one exact command or manual observation.
  Include changed-file checks, focused tests, relevant package/root checks,
  `git diff --check`, and `node scripts/validate-living-workflow.mjs` when the
  workflow artifacts changed.

- [ ] **Step 2: Record observed evidence, never intent.**

  Record commands, exit codes, concise output, criterion mapping, and remaining
  failures. On any failed required check, set `Status: failed`, do not update
  `NEXT.md` or the canonical plan, and require router re-entry at
  `implement-monorepo-change`.

- [ ] **Step 3: Validate the route.**

  Require `nextSkill: "reconcile-monorepo-change"` only for passed evidence;
  require `nextSkill: "implement-monorepo-change"` for failed evidence.
