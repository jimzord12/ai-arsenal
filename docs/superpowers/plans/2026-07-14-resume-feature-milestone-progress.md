# Resume Feature Milestone Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `jz-resume-feature` show decomposed milestone progress and issue counts for only the milestone selected by the current workflow frontier.

**Architecture:** `features-cli progress --json` remains the only canonical source for the report. Extend each existing milestone entry with an additive issue summary derived from canonical issue Markdown, then update the skill's rendering contract to select the frontier milestone from `issueId` or `milestoneSlug` and display that entry's summary.

**Tech Stack:** TypeScript, Bun, Jest, Markdown skill instructions, pnpm 10.33.0.

## Global Constraints

- Preserve `features-cli progress --json` compatibility: add fields only; do not rename or remove existing fields.
- Derive actionable and blocked counts using the complete canonical feature issue set so cross-milestone blockers remain correct.
- Keep `jz-resume-feature` read-only and retain `progress --json` as its authority.
- Do not show the global `Issues:` aggregate in the `jz-resume-feature` report.
- Do not commit, push, pack, publish, or globally install anything without direct user direction.

---

### Task 1: Add canonical per-milestone issue summaries to `progress --json`

**Files:**

- Modify: `packages/features-cli/src/progress-state.ts:38-90`
- Modify: `packages/features-cli/src/progress-state.ts:430-458`
- Modify: `packages/features-cli/src/progress-state.test.ts:46-166`

**Interfaces:**

- Consumes: canonical `IssueRecord[]`, milestone `issueIds`, `isIssueBlocked(issue, fullIssuesById)`.
- Produces: `FeatureProgress.milestones.entries[].issues` with exact shape `{ total: number; done: number; actionable: number; blocked: number }`.
- Compatibility: all existing `FeatureProgress` fields and all existing frontier selection remain unchanged.

- [ ] **Step 1: Write the failing progress-state expectation**

  In the existing Remote Logging topology test, assert the per-milestone entries before changing production code:

  ```ts
  expect(progress.milestones?.entries).toEqual([
    expect.objectContaining({
      slug: 'capture-and-store',
      issues: { total: 6, done: 1, actionable: 4, blocked: 1 },
    }),
    expect.objectContaining({
      slug: 'explicit-send',
      issues: { total: 3, done: 0, actionable: 0, blocked: 3 },
    }),
    expect.objectContaining({
      slug: 'manage-and-gate',
      issues: { total: 3, done: 0, actionable: 0, blocked: 3 },
    }),
  ]);
  ```

- [ ] **Step 2: Run the focused test and confirm the type/shape failure**

  Run:

  ```powershell
  pnpm --filter @jz/ai-arsenal-features-cli test -- progress-state.test.ts
  ```

  Expected: the existing test fails because each `milestones.entries[]` object has no `issues` property.

- [ ] **Step 3: Extend the progress type and add the minimal summary helper**

  Add the exact issue-summary property to the milestone entry type:

  ```ts
  issues: {
    total: number;
    done: number;
    actionable: number;
    blocked: number;
  }
  ```

  Add a private helper beside `summarizeIssues` that computes only the four required values. It must evaluate blockers against every canonical issue, not only issues in the selected milestone:

  ```ts
  function summarizeMilestoneIssues(
    issueIds: number[],
    allIssues: IssueRecord[],
  ): { total: number; done: number; actionable: number; blocked: number } {
    const selectedIds = new Set(issueIds);
    const selected = allIssues.filter((issue) => selectedIds.has(issue.id));
    const allIssuesById = new Map(allIssues.map((issue) => [issue.id, issue]));
    const terminal = (issue: IssueRecord) =>
      issue.status === 'done' || issue.status === 'wontfix';

    return {
      total: selected.length,
      done: selected.filter((issue) => issue.status === 'done').length,
      actionable: selected.filter(
        (issue) =>
          issue.status === 'ready-for-agent' &&
          !isIssueBlocked(issue, allIssuesById),
      ).length,
      blocked: selected.filter(
        (issue) => !terminal(issue) && isIssueBlocked(issue, allIssuesById),
      ).length,
    };
  }
  ```

  When constructing `milestones.entries`, set `issues` with:

  ```ts
  issues: summarizeMilestoneIssues(
    entry.issueIds,
    canonicalIssues?.issues ?? [],
  ),
  ```

- [ ] **Step 4: Run focused tests and static checks**

  Run:

  ```powershell
  pnpm --filter @jz/ai-arsenal-features-cli test -- progress-state.test.ts
  pnpm --filter @jz/ai-arsenal-features-cli typecheck
  pnpm --filter @jz/ai-arsenal-features-cli lint
  ```

  Expected: all commands exit `0`; the cross-milestone blockers in the fixture remain blocked and all existing frontier assertions still pass.

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
