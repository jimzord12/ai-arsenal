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
