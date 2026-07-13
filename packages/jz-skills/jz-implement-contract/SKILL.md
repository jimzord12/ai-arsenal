---
name: jz-implement-contract
description: Implement one contracted features-cli issue from SPEC.md, issue.md, and change-contract.md. Final stage of the SPEC -> milestones -> issues -> contract -> implement pipeline.
disable-model-invocation: true
---

# Implement Contract

## Purpose

Take **one** contracted issue and drive it to implemented, reviewed code. This is the final stage of the pipeline:

`jz-write-spec` -> `jz-spec-to-milestones` -> `jz-milestone-to-issues` -> `jz-issue-to-contract` -> **implementation**.

## Feature progress preflight

Run `features-cli progress --feature <slug> --json` first. Stop without mutation for `migration-required` or `archived`. Activate `todo`/`paused` automatically only when no feature is current; if another feature is current, stop for approval and then use one atomic `update-feature <slug> --status in-progress --pause-current` call. Proceed only at `implement-issue` or `review-issue` for the selected/resumable issue. At `contract-issue`, stop and name `jz-issue-to-contract`; at `feature-review`, stop because issue implementation is complete. A required CLI failure is a hard stop.

This skill is a thin per-issue orchestrator. It does not re-scope the issue, re-design the seams, or replace `tdd` / `code-review`. It reads the contract cage, chooses the loop from `Method`, performs clear deterministic implementation work itself, dispatches separate roles only where the selected method requires separation, runs verification and review, writes durable completion artifacts, and updates `features-cli`.

## Core rule

Every implementation role gets the full three-file context:

```text
SPEC.md + issue.md + change-contract.md
```

The SPEC is the why and normative detail. The issue is the slice. The contract is the cage. Do not give red, green, direct, or review agents only the issue and contract; that drops the source of truth for schemas, invariants, decision ids, and non-goals.

The implementation works inside the contract:

- **Soft scope**: edit freely, including small neighbouring additions that stay within the contract's intent.
- **Hard wall**: stop and surface the contract's `ScopeExpansionRequest` stub. Do not silently widen.

## Required input

Scope one issue. If the user did not name one, use:

```powershell
features-cli get-issue --next --feature <feature-slug>
```

Read the returned `contracted` and `nextAction` fields. Proceed only for `contracted: true` / `nextAction: implement`; route `nextAction: contract` to `jz-issue-to-contract`. When `progress` reports a mid-flight issue, use `get-issue --resume` instead.

Read:

```text
.scratch/features/<NNN>-<feature-slug>/SPEC.md
.scratch/features/<NNN>-<feature-slug>/issues/<NN>-<issue-slug>/issue.md
.scratch/features/<NNN>-<feature-slug>/issues/<NN>-<issue-slug>/change-contract.md
```

Confirm the issue `Status`, `Method`, `BlockedBy`, `Milestone`, `Traces`, contract soft scope, hard walls, seams, acceptance cases, verification commands, and escalation rules.

## Workflow

### 1. Announce and load the three-file context

Start with:

```text
I'm using the jz-implement-contract skill to implement issue <NN> against its change contract.
```

Read `SPEC.md`, `issue.md`, and `change-contract.md`. Follow the issue / contract traces into the SPEC sections they name.

**Done when** you can state the issue's postcondition, the contract's hard walls, the test seams, and the issue `Method` without relying on chat history.

### 2. Check the issue is runnable

Use `features-cli` to confirm the issue is actionable or resumable. Pass `--feature <slug>`; this repo often has another feature marked `in-progress`. For a fresh `get-issue --next` winner, require `nextAction: implement`; `nextAction: contract` belongs to `jz-issue-to-contract`.

Read `references/cli-phase-driving.md` before changing status.

**Done when** blockers are satisfied or the issue is a valid resume target, and the next CLI transition is known.

### 3. Move to implementation

Set the issue `Status` to `in-progress` through `features-cli`. Do not force transitions.

**Done when** the issue file and `issues-status.json` show `in-progress`.

### 4. Run the loop selected by `Method`

Read `references/method-topologies.md`.

- `tdd-pingpong`: dispatch a fresh **red** agent for one failing test, verify red, then dispatch a fresh **green** agent for the smallest passing implementation. Repeat by contract acceptance case / tracer bullet.
- `tdd-solo`: use the installed `tdd` skill yourself for one red -> green loop.
- `direct`: implement directly yourself for trivial/no-logic work, with tests only where the contract or repo pattern requires them.

Every dispatched red or green role receives `SPEC.md`, `issue.md`, and `change-contract.md`. Before orchestrator-owned `tdd-solo` or `direct` work, load the same three-file context yourself.

For an obvious, bounded change (for example, a two-line wiring, copy, or configuration correction with an established local pattern), edit it immediately. Do not spawn an implementation agent merely to make that change. Once all in-scope acceptance cases, verification, and the fresh review gate pass, complete the issue in the same run.

**Done when** every in-scope contract acceptance case is either implemented and verified, or blocked by a surfaced `ScopeExpansionRequest`.

### 5. Enforce the cage while coding

Read `references/contract-cage.md` before editing beyond an obvious soft-scope file.

Soft-scope neighbour additions are allowed. Hitting a hard wall, needing an architectural change, or finding that tests imply behaviour outside the SPEC / issue / contract stops implementation.

**Done when** all edits are inside the soft scope or explicitly justified as small neighbours, and no hard-wall breach is unresolved.

### 6. Verify locally

Read `references/validation-and-review.md`. Run targeted checks during the loop and full checks before review.

Expected baseline for source changes:

```powershell
npm run compile
npx jest <changed-or-new-test-file>
npm test
npm run lint
```

Use Node 20 for the full app test suite. A `better-sqlite3` ABI error means the wrong Node version, not a code failure.

**Done when** required checks pass, or failures are understood and fixed / reported.

### 7. Move to review

Read `references/completion-artifacts.md`. Choose the next immutable `reviews/<NN>-review.md` path, set `Status` to `in-review` through `features-cli`, then run a fresh `code-review` pass. The reviewer gets `SPEC.md`, `issue.md`, `change-contract.md`, the diff, and verification output. Ensure the fresh review is persisted at the reserved path.

**Done when** review has a clear pass/fail verdict and route grounded in Standards and Spec / contract compliance, and the numbered review report exists.

### 8. Apply the review verdict

If review passes, finalize `implementation-report.md` from the final diff, actual verification results, and every numbered review attempt. Apply the completion-artifact done gate, then set `Status` to `done` through `features-cli`.

After the status update succeeds, rerun `progress --feature <slug> --json`. If the final issue completed, report the `feature-review` frontier and leave the feature `in-progress`; do not archive it or set `finalStatus`. The future feature-review workflow owns archival.

If review fails, classify the finding:

- `red`: tests are missing, weak, wrong, at the wrong seam, or fail to cover a contract acceptance case.
- `green`: tests are valid, but implementation is wrong, incomplete, over-scoped, inconsistent with repo patterns, or needs refactor.
- `ScopeExpansionRequest`: the finding proves the contract / SPEC boundary is wrong or a hard wall must move.

Preserve the failed review report. Use `reopen-issue --phase red|green --reason-file <reviews/NN-review.md>` for red/green failures. Do not mark `done`. Do not patch review findings informally while the issue stays `in-review`.

**Done when** a passing issue has a final implementation report, a latest review report with verdict and route `PASS`, and status `done`; or a failed issue has its immutable review report and is reopened with `Phase`, `Reopens`, and `## Reopen History` recorded; or a ScopeExpansionRequest and its review evidence are surfaced to the user.

### 9. Final response

Report only:

- feature + issue implemented;
- status outcome (`done`, reopened at `red` / `green`, or ScopeExpansionRequest);
- files changed;
- verification commands and results;
- review outcome and any findings fixed;
- `implementation-report.md` and review report paths when status is `done`;
- next loop: follow `progress`; for a fresh `get-issue --next` winner, `nextAction: contract` routes to `jz-issue-to-contract` and `nextAction: implement` routes to this skill.

Do not paste the whole diff unless asked.

## Hard constraints

- Implement **one** contracted issue per run.
- Every role agent receives `SPEC.md`, `issue.md`, and `change-contract.md`.
- Do not renegotiate seams in Stage 5; implement against the contract's seams and acceptance cases.
- Do not cross a hard wall. Surface `ScopeExpansionRequest`.
- Do not skip the review gate: `in-progress -> done` is invalid by design.
- Do not mark an issue `done` before the latest numbered review report is `PASS` and `implementation-report.md` satisfies the completion-artifact done gate.
- Never overwrite or renumber a review report used for routing.
- Do not use `--force` for normal issue transitions.
- Do not self-review implementation. Use a fresh `code-review` pass.
- Preserve the issue's `Method`; this skill does not re-decide risk.
- Stage 5 writes source, so run code verification.

## Supporting references

- `references/method-topologies.md` — red / green / direct role prompts and completion criteria.
- `references/cli-phase-driving.md` — exact `features-cli` transitions, reopen path, and resume rules.
- `references/contract-cage.md` — soft-scope edits, hard-wall stops, and `ScopeExpansionRequest`.
- `references/validation-and-review.md` — verification commands, Node 20 note, and review verdict handling.
- `references/completion-artifacts.md` — numbered review reports, final implementation report, and the artifact-backed done gate.
