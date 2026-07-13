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
Milestones: <decomposed>/<planned> decomposed, <pending> remaining
Issues: <done>/<total> done, <pending> remaining, <actionable> actionable, <blocked> blocked, <contracted> contracted
Active/next work: #<id> — <title> (<active/resumable/next>)
Warnings: <none, or every warning code, message, and path>

Recommended next skill: `<skill>` — <reason tied to the frontier>.
```

- Omit `Focus` when `focusPath` is null.
- Show `Design artifacts` during design or whenever any artifact is missing.
- Show `Milestones` and `Issues` only when their JSON objects are non-null.
- `remaining` issues means `issues.pending`; show `wontfix` separately when
  nonzero.
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
