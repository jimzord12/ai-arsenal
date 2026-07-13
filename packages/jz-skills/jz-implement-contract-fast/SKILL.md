---
name: jz-implement-contract-fast
description: Use when the user explicitly chooses the fast path for one already-contracted features-cli issue.
disable-model-invocation: true
---

# Implement Contract Fast

## Purpose

Implement one contracted issue with one main-agent loop. Keep the contract cage, `features-cli` lifecycle, durable reports, and independent review while selecting verification from the actual change.

The user chooses this workflow. Do not route by risk and do not use the issue's `Method` field as an execution selector.

## Core ownership

The main agent owns scouting, implementation, test changes, verification decisions, review fixes, lifecycle transitions, and completion reporting.

Do not dispatch red, green, solo, direct, or repair agents. Dispatch a fresh agent only for the mandatory independent `code-review` pass.

## Engineering discipline

Keep the user-selected engineering discipline: `tdd`, `direct`, or `hybrid`. It changes how the main agent works; it never changes agent ownership. `Method` remains inert metadata in this workflow.

- `tdd`: the main agent performs every RED → GREEN → REFACTOR cycle itself. For each behavior, it writes and runs a focused failing test, makes the smallest implementation change, reruns it green, then refactors only while green.
- `direct`: the main agent makes the smallest deterministic change itself. It adds or updates tests when the contract, changed behavior, or repository pattern requires them.
- `hybrid`: the main agent uses its own RED → GREEN → REFACTOR cycles for behavioral logic and its own direct edits for deterministic wiring, configuration, copy, or equivalent no-logic work.

The only dispatch in any discipline is the mandatory independent `code-review` pass.

## 1. Preflight

Announce:

```text
I'm using jz-implement-contract-fast to implement issue <NN> with the single-agent fast loop.
```

Run:

```powershell
features-cli progress --feature <slug> --json
```

Stop without changing issue status or source files for `migration-required` or `archived`. At `feature-review`, stop because issue implementation is complete.

Activate `todo` or `paused` only when no other feature is current. If another feature is current, stop for approval, then use one atomic `update-feature <slug> --status in-progress --pause-current` call.

For a fresh issue, run:

```powershell
features-cli get-issue --next --feature <slug>
```

For a mid-flight issue, run:

```powershell
features-cli get-issue --resume --feature <slug>
```

Require `contracted: true`, `nextAction: implement`, and an existing `change-contract.md`. If any condition is absent, stop without mutation and route to `jz-issue-to-contract`. A required CLI failure is a hard stop.

## 2. Load the contract cage

Read fully:

```text
.scratch/features/<NNN>-<feature>/SPEC.md
.scratch/features/<NNN>-<feature>/issues/<NN>-<issue>/issue.md
.scratch/features/<NNN>-<feature>/issues/<NN>-<issue>/change-contract.md
```

Follow issue and contract traces into the SPEC. Establish the postcondition, acceptance cases, locked seams, soft scope, hard walls, blockers, and contract-required verification. The SPEC is normative, the issue is the slice, and the contract is the cage.

Treat `Method` as inert metadata in this workflow.

## 3. Enter implementation

Confirm blockers are satisfied, then run:

```powershell
features-cli update-status <id> --status in-progress --feature <slug>
```

Do not force normal transitions.

## 4. Run the fast loop

For each remaining acceptance case, the main agent scouts the surrounding implementation and tests, follows the established repository pattern, and makes the smallest coherent in-scope change.

Apply the selected engineering discipline:

- `tdd`: run the main-agent RED → GREEN → REFACTOR cycle for each changed behavior.
- `direct`: make the main-agent direct change, adding or updating a focused test when the contract, changed behavior, or repository pattern requires it.
- `hybrid`: choose the main-agent TDD cycle for behavioral logic and the main-agent direct path for deterministic no-logic work.

Run the narrowest command that provides meaningful feedback after each change. Repeat until every in-scope acceptance case is satisfied.

Edit soft-scope files and small neighbors that preserve the same module, seam, invariants, and behavior. When implementation requires moving a hard wall, fill the contract's `ScopeExpansionRequest`, surface it, and stop.

Assume compile, tests, and lint passed before this issue began. Do not run baseline quality gates.

## 5. Verify and review

Read [references/review-and-verification.md](references/review-and-verification.md) before choosing final checks or moving to review.

Select verification from the contract and final diff. Record both commands run and broad gates deliberately skipped.

Then reserve the next immutable `reviews/<NN>-review.md` and run:

```powershell
features-cli update-status <id> --status in-review --feature <slug>
```

Dispatch one fresh independent reviewer using the `code-review` skill. Give it `SPEC.md`, `issue.md`, `change-contract.md`, the final diff, verification evidence, soft-scope neighbors, and intentional scope cuts. Persist its report at the reserved path without changing its verdict or findings.

At least one independent review attempt is mandatory.

## 6. Converge and complete

On review `PASS`, finalize `implementation-report.md` and mark the issue `done`.

On review `FAIL`, preserve the report and fix every actionable finding yourself while the issue remains `in-review`. Follow the reference's observable re-review decision. A mechanical, non-behavioral fix set may complete without another review; behavioral, structural, risky, or uncertain fixes require the next numbered review.

Never mark `done` with an unresolved review finding.

When the completion gate in the reference is satisfied, run:

```powershell
features-cli update-status <id> --status done --feature <slug>
features-cli progress --feature <slug> --json
```

If this completed the final issue, report the `feature-review` frontier and leave the feature `in-progress`. Feature review owns archival.

## Final response

Report only:

- feature and issue;
- final status;
- files changed;
- verification run and intentionally skipped;
- every review attempt and how findings were resolved;
- `implementation-report.md` and review report paths;
- the next progress frontier.

Do not paste the full diff unless asked.

## Hard constraints

- Implement one contracted issue per run.
- Keep implementation and repair work with the main agent.
- Preserve the selected `tdd`, `direct`, or `hybrid` engineering discipline while keeping every implementation step with the main agent.
- Ignore `Method` as a topology selector.
- Run at least one independent review.
- Preserve every numbered review report.
- Select checks proportionally; do not run baseline gates.
- Stay inside the contract cage.
- Do not force normal lifecycle transitions.
- Do not complete with unresolved acceptance cases or review findings.
