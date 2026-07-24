### Task 2: Update the Resume Feature reporting contract

**Files:**

- Modify: `packages/jz-skills/jz-resume-feature/SKILL.md:34-66`
- Verify: `packages/jz-skills/jz-resume-feature/SKILL.md`

**Interfaces:**

- Consumes: `progress.milestones.entries[].issues`, `frontier.issueId`, and `frontier.milestoneSlug` from Task 1.
- Produces: the `jz-resume-feature` Markdown report with overall milestone decomposition and current-milestone-only issue counts.
- Boundary: permitted operations remain `get-feature`, `progress`, and the existing limited `get-issue` title lookup; no new CLI commands or state mutations are allowed.

- [ ] **Step 1: Replace the report-shape lines in the skill contract**

  Replace the existing global milestone and issue aggregate lines with these exact report lines:

  ```markdown
  Milestones: <decomposed>/<planned> decomposed
  Current milestone: `<milestone-slug>`
  Current milestone issues: <done>/<total> done · <actionable> actionable · <blocked> blocked
  ```

  Remove the global `Issues: <done>/<total> ...` line. Retain `Active/next work` because it names the selected issue and title, rather than acting as a global aggregate.

- [ ] **Step 2: Specify deterministic current-milestone selection**

  Add rendering instructions immediately below the report shape:

  ```markdown
  - When `frontier.issueId` is present, select the milestone entry whose
    `issueIds` contains that ID.
  - Otherwise, when `frontier.milestoneSlug` is present, select the entry with
    that slug.
  - When neither lookup identifies an entry, write both `Current milestone`
    lines with `not identified`.
  ```

  Preserve the existing rule that the overall `Milestones` line is shown only when the progress JSON provides a milestones object. The two current-milestone lines always appear; when `milestones` is null, both use `not identified`.

- [ ] **Step 3: Add report-contract examples to the skill**

  Add three compact examples directly after the rendering rules:

  ```text
  Milestones: 2/4 decomposed
  Current milestone: `capture-and-store`
  Current milestone issues: 1/6 done · 4 actionable · 1 blocked
  ```

  ```text
  Milestones: 1/3 decomposed
  Current milestone: `explicit-send`
  Current milestone issues: 0/3 done · 0 actionable · 3 blocked
  ```

  ```text
  Current milestone: not identified
  Current milestone issues: not identified
  ```

  These examples cover an issue-owned frontier, a milestone-owned frontier, and the no-match fallback without adding a new executable test harness for Markdown-only skill instructions.

- [ ] **Step 4: Verify the skill contract and affected packages**

  Run:

  ```powershell
  rg -n "^Issues:|^Milestones:|^Current milestone" packages/jz-skills/jz-resume-feature/SKILL.md
  pnpm --filter @jz/ai-arsenal-jz-skills test
  pnpm --filter @jz/ai-arsenal-features-cli test -- progress-state.test.ts
  pnpm format:check
  git diff --check
  ```

  Expected: no `Issues:` global report line remains; the overall milestone and both current-milestone lines are present; both package tests, formatting verification, and whitespace verification exit `0`.
