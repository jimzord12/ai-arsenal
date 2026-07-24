# Resume Feature Milestone Progress Design

## Goal

Make `jz-resume-feature` report milestone progress more explicitly while
keeping `features-cli progress --json` as the canonical, read-only source of
truth.

## Scope

- Add an additive per-milestone issue summary to `progress --json`.
- Render the overall decomposed milestone progress in `jz-resume-feature`.
- Render issue counts only for the milestone identified by the current
  frontier.
- Use `not identified` when the frontier has no identifiable milestone.

## CLI progress contract

Each `milestones.entries[]` object returned by `features-cli progress --json`
will retain its existing fields and gain:

```json
{
  "issues": {
    "total": 3,
    "done": 1,
    "actionable": 1,
    "blocked": 1
  }
}
```

The counts are derived from canonical issue state for the entry's `issueIds`.
The change is additive: existing consumers of the progress JSON remain valid.

## Resume Feature report contract

The skill will render:

```text
Milestones: <decomposed>/<planned> decomposed
Current milestone: `<milestone-slug>`
Current milestone issues: <done>/<total> done · <actionable> actionable · <blocked> blocked
```

The existing global `Issues:` aggregate is removed. The report therefore
shows issue counts only for the milestone that owns the immediate frontier.

## Current milestone selection

- When `frontier.issueId` is present, select the milestone entry whose
  `issueIds` contains that ID.
- When `frontier.milestoneSlug` is present, select the entry with that slug.
- When neither method identifies an entry, render:

  ```text
  Current milestone: not identified
  Current milestone issues: not identified
  ```

These two lines always appear, including when the progress response has no
milestones object yet.

## Verification

- CLI tests prove per-milestone totals, done, actionable, and blocked counts
  are correct and existing progress fields are preserved.
- Skill-contract checks cover an issue-owned frontier, a milestone-owned
  frontier, and a frontier with no identifiable milestone.
- The report contains the overall milestone progress and no global issue
  aggregate.
