### Task 3: Run the full in-scope verification suite

**Files:**

- Verify: `packages/features-cli/src/progress-state.ts`
- Verify: `packages/features-cli/src/progress-state.test.ts`
- Verify: `packages/jz-skills/jz-resume-feature/SKILL.md`

**Interfaces:**

- Consumes: completed Tasks 1 and 2.
- Produces: evidence that the additive CLI schema and the skill contract remain valid within their package boundaries.

- [ ] **Step 1: Run the complete features-cli package checks**

  Run:

  ```powershell
  pnpm --filter @jz/ai-arsenal-features-cli format
  pnpm --filter @jz/ai-arsenal-features-cli lint
  pnpm --filter @jz/ai-arsenal-features-cli typecheck
  pnpm --filter @jz/ai-arsenal-features-cli test
  ```

  Expected: each command exits `0`, including coverage-enforced Jest execution.

- [ ] **Step 2: Run the content-package and repository whitespace checks**

  Run:

  ```powershell
  pnpm --filter @jz/ai-arsenal-jz-skills test
  pnpm format:check
  git diff --check
  ```

  Expected: every command exits `0`; no formatting or whitespace error is introduced.

- [ ] **Step 3: Inspect the final diff before handoff**

  Run:

  ```powershell
  git diff -- packages/features-cli/src/progress-state.ts packages/features-cli/src/progress-state.test.ts packages/jz-skills/jz-resume-feature/SKILL.md
  git status --short
  ```

  Expected: the diff is limited to the approved progress-schema addition, focused test updates, and the skill report contract. Do not stage, commit, push, pack, publish, or globally install changes.
