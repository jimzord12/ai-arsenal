### Task 6: Write `plan-monorepo-change`

**Files:**

- Create: `.agents/skills/plan-monorepo-change/SKILL.md`
- Create: `.agents/skills/plan-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: ready `change-contract.md` and its acceptance/test-seam sections.
- Produces: `implementation-plan.md` revision `1`, prerequisite `contract@1`,
  status `ready`.

- [ ] **Step 1: Require executable plan entries.**

  Every plan entry names exact paths, inputs, outputs, test command, expected
  result, and a rollback note when a stateful change is involved. The plan must
  not add requirements outside the contract.

- [ ] **Step 2: Require pre-implementation review.**

  End the skill by presenting the plan to the user for approval. It must not
  create `approval.md`, edit production files, or treat silence as approval.

- [ ] **Step 3: Validate the blocked state.**

  Run the validator and require `valid: true`, `nextSkill: null`, and an
  explicit-approval blocker.
