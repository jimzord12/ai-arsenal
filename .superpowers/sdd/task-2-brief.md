### Task 2: Write `orchestrate-monorepo-work`

**Files:**

- Create: `.agents/skills/orchestrate-monorepo-work/SKILL.md`
- Create: `.agents/skills/orchestrate-monorepo-work/agents/openai.yaml`

**Interfaces:**

- Consumes: Task 1 guide, `NEXT.md`, scoped instructions, Git state, and
  validator JSON.
- Produces: the eight-field routing brief only; no filesystem output.

- [ ] **Step 1: Write the skill with `Use when` frontmatter and explicit read-only rule.**

  Require reading root/scoped `AGENTS.md`, `NEXT.md`, the canonical plan section
  named by `NEXT.md`, `git status --short`, recent commits, and validator JSON.
  Require `node scripts/validate-monorepo-work-item.mjs --work-item <id> --json`
  when an active work item exists.

- [ ] **Step 2: Implement the routing brief contract.**

  Require exactly these fields: Project, Current work item, Current pipeline
  step, Next skill, Required input, Why this is next, Approval/blockers, and
  Recommended command. For no active item, report the current `NEXT.md` action
  and recommend `capture-monorepo-change` only after the user describes a new
  change.

- [ ] **Step 3: Add stop conditions and metadata.**

  For validator-invalid state, multiple active work items, stale approval, or
  malformed workflow metadata, require a stopped report that recommends
  `initializing-living-plan-workflow`; never select a normal next skill.
  Copy the existing `agents/openai.yaml` schema with a router-specific display
  name, concise description, and `allow_implicit_invocation: true`.

- [ ] **Step 4: Run the focused checks.**

  Run:

  ```powershell
  node scripts/validate-monorepo-work-item.mjs --work-item none --json
  pnpm format:check
  ```

  Expected: valid no-active JSON and no formatting violations.
