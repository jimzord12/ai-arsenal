# Completion artifacts

Load this after local verification and before moving an issue to review.

Every completed Stage 5 issue leaves durable implementation and review evidence in its issue directory:

```text
.scratch/features/<id>-<slug>/issues/<NN>-<issue-slug>/
  issue.md
  change-contract.md
  implementation-report.md
  reviews/
    01-review.md
    02-review.md
```

This contract applies to `tdd-pingpong`, `tdd-solo`, and `direct`.

## Review attempt lifecycle

Before dispatching a fresh review:

1. Ensure `reviews/` exists.
2. Find existing files matching `<NN>-review.md`.
3. Choose the next two-digit number after the highest existing attempt, starting at `01`.
4. Reserve `reviews/<NN>-review.md` for this attempt.

The fresh reviewer owns the report content. The reviewer may write the file directly, or the orchestrator may persist the returned report without changing its verdict or findings.

Every review attempt creates one report, including failed reviews. Review reports are immutable after the verdict is used for routing. Never overwrite or renumber an earlier attempt.

The report contains:

- attempt number, date, reviewer role, issue, verdict, and required route;
- review scope and source artifacts considered;
- Standards verdict;
- SPEC / issue / change-contract verdict;
- blocking findings with stable labels;
- non-blocking findings;
- verification evidence considered;
- required route: `PASS`, `red`, `green`, or `ScopeExpansionRequest`.

Use this shape:

```markdown
# Issue Review <NN>: <Issue Title>

Date: <YYYY-MM-DD>
Reviewer: <role or identifier>
Issue: `<issue>`
Verdict: `PASS|FAIL`
Route: `PASS|red|green|ScopeExpansionRequest`

## Scope

<Artifacts, diff, and files reviewed.>

## Standards Verdict

<Verdict and evidence.>

## Spec And Contract Verdict

<Verdict and evidence.>

## Blocking Findings

### F-01: <Finding title>

<Evidence, impact, and required correction.>

## Non-Blocking Findings

- <Finding or `None.`>

## Verification Considered

- `<command>` - `PASS|FAIL`: <result summary>

## Required Route

<Why this attempt passes, reopens at red/green, or requires scope expansion.>
```

Use `None.` for an empty findings section. Do not omit required sections.

## Failed review routing

For `red` or `green`, preserve the failed report and pass its path to `reopen-issue --reason-file`. Corrections lead to a new review attempt and a new numbered report.

For `ScopeExpansionRequest`, preserve the report and surface the contract boundary failure. Do not finalize `implementation-report.md` and do not mark the issue `done`.

Do not create separate review-response files. The next implementation state and review attempt demonstrate resolution; the final implementation report summarizes the history.

## implementation-report.md contract

The Stage 5 orchestrator owns `implementation-report.md`. A draft may exist during work, but finalize it only after the latest fresh review has verdict and route `PASS`.

The final report contains:

1. Feature and issue identity plus completion date.
2. Observable behavior implemented.
3. Every changed file grouped into production, test, supporting/configuration, and deleted files.
4. Intentionally skipped or out-of-scope work with its owner or reason.
5. Every verification command and its actual result.
6. Known unrelated failures clearly distinguished from passing checks.
7. A linked row for every numbered review attempt, its verdict, and its resolution route.
8. The final passing review outcome.

A failing command remains `FAIL`. If repository policy or an explicit human decision permits completion because the failure is unrelated and pre-existing, cite that basis in the report and require the final reviewer to acknowledge it.

Use this shape:

```markdown
# Implementation Report: Issue <NN>

Date: <YYYY-MM-DD>
Feature: `<feature>`
Issue: `<issue>`

## Behavior Implemented

- <Observable outcome>

## Files Changed

### Production

- <Path or `None.`>

### Tests

- <Path or `None.`>

### Supporting Or Configuration

- <Path or `None.`>

### Deleted

- <Path or `None.`>

## Out Of Scope

- <Skipped behavior and owner/reason, or `None.`>

## Verification

- `<command>` - `PASS|FAIL`: <result summary>

## Review History

| Attempt                    | Verdict | Resolution                   |
| -------------------------- | ------- | ---------------------------- |
| [01](reviews/01-review.md) | `FAIL`  | Reopened at green: <summary> |
| [02](reviews/02-review.md) | `PASS`  | Final review                 |

## Final Outcome

Final review: `PASS`
```

## Done gate

Before running `features-cli update-status ... --status done`, verify:

- all in-scope acceptance cases are implemented or covered by approved scope change;
- required verification completed under repository policy;
- `implementation-report.md` exists and matches the final diff;
- every review attempt has an immutable numbered report;
- the latest review report has verdict and route `PASS`;
- the implementation report links every review attempt and records the final pass.

Only after every condition is true may the orchestrator mark the issue `done`.

This initial rollout relies on the skill and reviewer to enforce the gate. `features-cli` does not yet validate artifact existence.
