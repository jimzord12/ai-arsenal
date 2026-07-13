### Task 7: Write `record-monorepo-approval`

**Files:**

- Create: `.agents/skills/record-monorepo-approval/SKILL.md`
- Create: `.agents/skills/record-monorepo-approval/agents/openai.yaml`

**Interfaces:**

- Consumes: explicit user approval in the current conversation and a ready
  `implementation-plan.md`.
- Produces: `approval.md` revision `1`, prerequisite `plan@1`, status
  `approved`, with SHA-256 of the exact current plan bytes.

- [ ] **Step 1: Reject implied approval.**

  The skill may run only after a direct user approval. A request for a summary,
  a question, or lack of objection is not approval.

- [ ] **Step 2: Record and verify the digest.**

  Calculate the digest with Node or PowerShell over the exact UTF-8 plan file,
  write the three approval fields from the shared interface, then run the
  validator.

- [ ] **Step 3: Require the implementation route.**

  Expected validator JSON: `valid: true` and
  `nextSkill: "implement-monorepo-change"`.
