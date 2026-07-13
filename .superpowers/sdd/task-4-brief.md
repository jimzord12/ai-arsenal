### Task 4: Write `orient-monorepo-change`

**Files:**

- Create: `.agents/skills/orient-monorepo-change/SKILL.md`
- Create: `.agents/skills/orient-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: ready `request.md`, active `NEXT.md`, applicable instructions, Git
  state, and source/docs relevant to the request.
- Produces: `context.md` revision `1` with prerequisite `request@1` and status
  `ready`.

- [ ] **Step 1: Require repository evidence gathering.**

  Read the nearest applicable instructions before inspecting source. Record
  branch/commit, `git status --short`, relevant package/docs paths, existing
  commands/tests, risks, and unresolved questions in the context template.

- [ ] **Step 2: Prevent scope and implementation.**

  Prohibit source edits, plan writing, acceptance-criteria creation, and
  release actions. If the request is ambiguous enough to prevent reliable
  context, report the exact question and stop.

- [ ] **Step 3: Validate the handoff.**

  Run the validator and require `nextSkill: "scope-monorepo-change"`.
