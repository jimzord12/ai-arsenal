---
name: jz-resume-feature
description: Report the current Spec-to-Ship feature state and recommend the next workflow skill.
---

# Resume Feature

## Purpose

Orient a new session from canonical `features-cli` state. Produce one concise
status report and one frontier-owned next-skill recommendation. This workflow
is read-only: reporting a paused or todo feature never activates it.

## Load canonical state

Run from the repository root.

1. If the user supplied a feature slug, use it. Otherwise run
   `features-cli get-feature` and read the current feature's `slug`. If there is
   no current feature, report that and stop.
2. Run `features-cli progress --feature <slug> --json`. Treat this JSON as the
   authority for identity, phase, focus, artifacts, milestones, issues,
   frontier, and warnings.
3. Resolve an issue title only when issue work is selected:
   - When `issues.resumableIssueId` is non-null, run
     `features-cli get-issue --resume --feature <slug>`.
   - Otherwise, for `contract-issue` or `implement-issue`, run
     `features-cli get-issue --next --feature <slug>` and confirm its id equals
     `frontier.issueId`.
   - If a `review-issue` title is not returned by `--resume`, locate the
     canonical issue source whose parsed leading numeric id equals
     `frontier.issueId`. Follow the CLI's accepted flat and directory forms;
     do not assume zero-padding or a hyphenated filename.

If a required CLI command fails or the selected issue disagrees with the
frontier, report the failed command and its error, or the exact mismatch, then
stop. Do not infer a replacement from chat history, Git history, `STATUS.md`,
or stale artifacts.

## Render the report

Use this shape, omitting only the conditional lines noted below:

```markdown
## Feature status

Feature: #<id> `<slug>` — <status>, <phase> phase
Current position: `<frontier.kind>` — <frontier.summary>
Focus: `<focusPath>`
Design artifacts: PRD=<yes/no>, grill=<yes/no>, decisions=<yes/no>, SPEC=<yes/no>
Milestones: <decomposed>/<planned> decomposed
Current milestone: `<milestone-slug>`
Current milestone issues: <done>/<total> done · <actionable> actionable · <blocked> blocked
Active/next work: #<id> — <title> (<active/resumable/next>)
Warnings: <none, or every warning code, message, and path>

Recommended next skill: `<skill>` — <reason tied to the frontier>.
```

- When `frontier.issueId` is present, select the milestone entry whose
  `issueIds` contains that ID.
- Otherwise, when `frontier.milestoneSlug` is present, select the entry with
  that slug.
- When neither lookup identifies an entry, write both `Current milestone`
  lines with `not identified`.
- For a selected entry, populate `Current milestone issues` from that entry's
  `issues` values.
- Show `Milestones` only when the progress JSON provides a `milestones` object.
  The two current-milestone lines always appear; when `milestones` is null,
  both use `not identified`.

Examples:

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

- Omit `Focus` when `focusPath` is null.
- Show `Design artifacts` during design or whenever any artifact is missing.
- If no issue is selected, write `Active/next work: none`.
- Keep the report compact. Give exactly one next recommendation; do not add a
  follow-on workflow after it.

## Route the frontier

| `frontier.kind`                   | Recommended next skill                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `write-prd`                       | `jz-feature-grilling`                                                                  |
| `grill-and-consolidate-decisions` | `jz-feature-grilling`                                                                  |
| `design-ready`                    | `jz-write-spec`                                                                        |
| `write-spec`                      | `jz-write-spec`                                                                        |
| `plan-milestones`                 | `jz-spec-to-milestones`                                                                |
| `decompose-milestone`             | `jz-milestone-to-issues`                                                               |
| `contract-issue`                  | `jz-issue-to-contract`                                                                 |
| `implement-issue`                 | `jz-implement-contract`                                                                |
| `review-issue`                    | `jz-implement-contract`                                                                |
| `migration-required`              | No installed stage skill; report the migration-note path from `frontier.artifactPath`. |
| `blocked`                         | No installed stage skill; report the blocked count and warnings.                       |
| `feature-review`                  | No installed stage skill currently owns feature review.                                |
| `archived`                        | No next skill; the feature is archived.                                                |

For a no-owner frontier, replace the recommendation line with:

```text
Recommended next skill: none — <frontier-specific reason>.
```

## Read-only boundary

Allowed operations are `get-feature`, `progress`, `get-issue`, and the
single issue-title read above. Never run lifecycle mutations such as
`update-feature`, `update-status`, `reopen-issue`,
`mark-milestone-decomposed`, or edit feature artifacts while using this skill.
