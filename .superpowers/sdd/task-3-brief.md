### Task 3: Write `capture-monorepo-change`

**Files:**

- Create: `.agents/skills/capture-monorepo-change/SKILL.md`
- Create: `.agents/skills/capture-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: an explicit user request, no active work item, and the request
  template from Task 1.
- Produces: `docs/work-items/<id>/request.md` at revision `1` and `NEXT.md`
  active-work-item fields set to `<id>` / `orient-monorepo-change`.

- [ ] **Step 1: Require collision-free ID selection.**

  The skill derives `<id>` as `YYYY-MM-DD-<lowercase-kebab-slug>` from the
  request, verifies the target directory does not exist, and stops for user
  direction if it does. It must not overwrite an existing work item.

- [ ] **Step 2: Require exact request contents.**

  Fill every request-template section from user-provided facts. Record unknown
  details as questions; do not invent constraints or acceptance criteria.

- [ ] **Step 3: Require active registration and validation.**

  Update only the two active-work-item fields in `NEXT.md` without changing its
  required headings. Then run:

  ```powershell
  node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
  ```

  Expected: `valid: true` and `nextSkill: "orient-monorepo-change"`.
