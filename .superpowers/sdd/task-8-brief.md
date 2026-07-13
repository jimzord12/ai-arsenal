### Task 8: Write `implement-monorepo-change`

**Files:**

- Create: `.agents/skills/implement-monorepo-change/SKILL.md`
- Create: `.agents/skills/implement-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: contract, approved plan whose digest matches `approval.md`, and the
  current worktree.
- Produces: allowed source/docs/test changes and `implementation-report.md`
  with prerequisites `contract@1, plan@1, approval@1`, status `ready`.

- [ ] **Step 1: Enforce the approval and contract cage.**

  Run the validator before edits. Refuse to work on a stale digest, missing
  approval, invalid workflow state, or task outside the contract. Read scoped
  instructions before every affected path; `packages/features-cli/AGENTS.md`
  prohibits invoking `features-cli` for package self-maintenance.

- [ ] **Step 2: Require test-first execution for behavior changes.**

  For each behavior change: write a focused failing test, run it and observe the
  intended failure, implement the smallest conforming change, and rerun the
  focused test. Documentation-only changes still require applicable formatter
  and workflow validation.

- [ ] **Step 3: Write the implementation report.**

  List each changed path, decision, test added or changed, verification already
  run, and any contract deviation. A deviation is a stop condition, not an
  undocumented expansion.

- [ ] **Step 4: Validate the handoff.**

  Run the validator and require `nextSkill: "verify-monorepo-change"`.
