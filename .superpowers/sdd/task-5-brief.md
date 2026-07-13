### Task 5: Write `scope-monorepo-change`

**Files:**

- Create: `.agents/skills/scope-monorepo-change/SKILL.md`
- Create: `.agents/skills/scope-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: ready `request.md` and `context.md` with matching work-item ID.
- Produces: `change-contract.md` revision `1`, prerequisites `request@1,
context@1`, status `ready`.

- [ ] **Step 1: Require a complete contract.**

  Fill the contract template with one goal, explicit non-goals, hard walls,
  acceptance criteria, observable test seams, exact verification categories,
  and whether implementation approval is required. Preserve user-locked
  constraints verbatim.

- [ ] **Step 2: Enforce approval boundaries.**

  Stop and ask the user before a contract would change public behavior, schema,
  major dependency, material operational cost, distribution direction, source
  deletion, or user data. Record the unanswered decision in the contract rather
  than proceeding.

- [ ] **Step 3: Validate the handoff.**

  Run the validator and require `nextSkill: "plan-monorepo-change"`.
