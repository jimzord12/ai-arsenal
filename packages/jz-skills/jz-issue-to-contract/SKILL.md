---
name: jz-issue-to-contract
description: Scope ONE features-cli issue against the repo (read-only) and write a change-contract.md beside it — soft scope vs hard walls, locked test seams, triangulating acceptance cases. Stage 4 of the SPEC → milestones → issues → contract → implement pipeline.
disable-model-invocation: true
---

# Issue to Contract

## Purpose

Take **one issue** and write the `change-contract.md` the thin issue lacks: the repo-grounding layer that turns "what to build" into **which files, which walls, which seams, which acceptance cases**. This is where the test **seams** get locked (per Matt's `tdd` skill) so stage 5's red→green loop implements against them instead of renegotiating them.

This skill scopes and writes a contract. It is **read-only on code** — it never edits source. Its only output is `change-contract.md`.

Stage 4 of the pipeline: `jz-write-spec` → `jz-spec-to-milestones` → `jz-milestone-to-issues` → **contract** → `jz-implement-contract`.

## Feature progress preflight

`features-cli` is the installed private CLI. From the repository root, invoke
the command on `PATH`:

```powershell
features-cli progress --feature <slug> --json
```

Run that `progress` command first. Use the `features-cli` command for subsequent commands, for example `features-cli get-issue --next-contract --feature <slug>` and `features-cli update-feature <slug> --status in-progress --pause-current`. Stop without mutation for `migration-required` or `archived`. Activate `todo`/`paused` automatically only when no feature is current; if another feature is current, stop for approval and then use one atomic `update-feature <slug> --status in-progress --pause-current` call. At `contract-issue`, contract the reported issue. For an unnamed issue or an explicit request for the next issue needing a contract, run `get-issue --next-contract --feature <slug>`; its winner is allowed as one contract-ahead slice even when the immediate frontier is `implement-issue` or `review-issue`. For a named issue outside those cases, proceed only on an explicit contract revision request. A required CLI failure is a hard stop.

## Core rule

The contract is a **bendable cage**. It grounds the issue in real repo files and draws a boundary the stage-5 implementer works inside:

- **Soft scope** — the primary files to create/edit **plus reasonable neighbours**. Editable freely; small in-scope additions need no permission.
- **Hard wall** — an out-of-scope file, an invariant to preserve, or a public interface that must stay stable. Hitting one means **STOP and emit a `ScopeExpansionRequest`** — never silently widen.

The cage constrains bad choices without ceremony. Expansion is cheap (the stage-5 orchestrator approves small additions inline); only an architectural need triggers a full re-scope. Do not build speculative hard walls for edge cases the SPEC deferred (small-team bar, root `CLAUDE.md`).

A contract lives or dies on its **seams** and its **triangulating acceptance cases**: a seam is the public boundary a test observes behaviour at; triangulation is ≥2–3 concrete cases per seam so a fresh green agent **cannot fake a pass** with a hardcoded return.

## Required input

Scope **one issue**. If the user did not name one, use the `get-issue --next-contract --feature <slug>` winner, or ask:

```text
.scratch/features/<NNN>-<slug>/issues/<NN>-<issue-slug>/issue.md
```

Read, and follow the issue's `Traces:` line into the SPEC — that line is the load-bearing link to the SPEC's deep context (schemas, invariants, interfaces, existing-file map). The SPEC already carries scaffolding the contract builds on; reference it, do not duplicate it:

- `.scratch/features/<NNN>-<slug>/SPEC.md` — §_Files to Create_ / §_Files to Modify_ / §_Relevant Existing Files_ ground the soft scope; §_Interfaces That Must Stay Stable_ + the §_invariants_ / §_state-transition_ rules ground the hard walls; the §_domain model_ / §_contracts_ ground the seams and acceptance cases.

## Output location

Write the contract beside its issue (directory-form — that is why stage 3 chose it):

```text
.scratch/features/<NNN>-<slug>/issues/<NN>-<issue-slug>/change-contract.md
```

One contract per run, for one issue. Format is in `references/contract-format.md`.

## Workflow

### 1. Announce and read the issue

Start with:

```text
I'm using the jz-issue-to-contract skill to scope the "<issue-slug>" issue into a change contract.
```

Then read the `issue.md` (its behaviour, acceptance criteria, `Method`, `Traces:` line) and follow every `Traces:` id into the SPEC.

**Done when** you can state the issue's slice in one sentence and have the SPEC definition of every `Traces:` id in view.

### 2. Scan the repo (read-only)

Read `references/scoping-heuristics.md`. This is the one stage that legitimately reads app code — grep and read to **pin real file paths**, the existing patterns to match, and the neighbours a change will touch. Ground every path in a file that actually exists; the SPEC's file map is a starting point, not proof a path is current.

**Done when** every file you will name in soft scope or a hard wall has been opened or grep-confirmed to exist, and you can name the existing pattern each edit must match.

### 3. Draw the cage — soft scope vs hard walls

Split what the repo scan surfaced into **soft scope** (primary files + reasonable neighbours, editable) and **hard walls** (out-of-scope files, invariants to preserve, public interfaces that must stay stable). Ground the walls in the SPEC's stable-interface list and its invariants — a wall must be a real constraint the SPEC states, not a guess.

**Done when** every soft-scope entry is a real path with a one-line reason, and every hard wall names the specific interface/invariant/file it protects and why hitting it forces a stop.

### 4. Lock the seams and triangulate

For the issue's behaviour, name the **seams** — the public boundaries a test observes at (never internals; see `tdd`'s anti-patterns). For each seam write **triangulating acceptance cases**: ≥2–3 concrete input→observable-outcome pairs whose expected values come from an independent source (the SPEC, a worked example, a known-good literal), never recomputed the way the code would compute them. An acceptance case may only assert behaviour this issue's own slice — or a transitive blocker — delivers.

**Done when** every behaviour the issue promises maps to a seam, each seam has ≥2 triangulating cases with independently-sourced expected values, and no case asserts behaviour outside the issue's slice + blockers.

### 5. Confirm the seams (blocking only)

Present the seams and their acceptance cases to the user — this is `tdd`'s "no test at an unconfirmed seam", pulled forward to contract time so stage 5 doesn't relitigate. Ask only genuinely blocking questions, one at a time (is this the right boundary to test at? is a case missing or over-reaching?). Skip when the seams are unambiguous; do not batch questions.

**Done when** the user has confirmed the seams, or there was no genuine ambiguity to resolve.

### 6. Carry Method and set escalation rules

Carry the issue's `Method` (`tdd-pingpong` / `tdd-solo` / `direct`) into the contract with a one-line risk note, so stage 5 picks the red/green topology. State the **escalation rules** — exactly what forces a `ScopeExpansionRequest` (hitting a hard wall; needing an architectural change; tests implying different behaviour than the issue/SPEC). Small in-scope neighbour additions are cheap and do **not** need one.

**Done when** the contract carries the issue's `Method` verbatim and lists the concrete conditions that force a stop.

### 7. Write the change contract

Read `references/contract-format.md`. Write `change-contract.md` beside the issue with every section: goal/postcondition, traces, soft scope, hard walls, seams, triangulating acceptance cases, Method/risk, escalation rules, and the `ScopeExpansionRequest` stub.

**Done when** the file exists at the right path and every section is filled with repo-grounded content (no placeholder text, no invented paths).

### 8. Verify with fresh eyes (subagent review)

Dispatch a **fresh subagent** to review the contract against the issue + SPEC + repo. Do not self-review — the value is a reader who has not rationalized the scope you just drew. The contract is high-leverage: it cages stage 5, so every error it contains is inherited by the implementation.

Give the subagent the contract, the issue, the SPEC path, and repo access. Ask for findings, not praise:

```text
You are reviewing a change contract for the "<issue-slug>" issue, against <issue.md path> and <SPEC path>, with repo access. You did not write it. Do not praise it. Report only problems, most severe first:

1. Soft scope grounded — every soft-scope path actually exists in the repo (or is a plausible new file whose directory exists), and matches the SPEC's file map.
2. Hard walls real — every hard wall corresponds to a stable interface / invariant the SPEC actually states (check §*Interfaces That Must Stay Stable* and the invariants), not an invented constraint. Flag walls that would block the issue's own required work.
3. Triangulation — every seam has ≥2 acceptance cases whose expected values come from an independent source, not recomputed the way the code would. Flag any case a hardcoded return could satisfy (a fake-able pass).
4. Slice consistency — no acceptance case asserts behaviour outside this issue's slice + its transitive blockers.

Return concrete findings (section, offending line, what's wrong). If a category is clean, say so.
```

Fix every legitimate finding inline — reground a path, drop or correct a wall, add a triangulating case, tighten a seam. Re-dispatch if the fixes were substantial. If the harness genuinely has no subagent capability, do the same four checks yourself in a deliberate second pass against the repo and SPEC — but a fresh subagent is strongly preferred.

**Done when** the review reports no ungrounded path, no invented or blocking hard wall, no fake-able acceptance case, and no out-of-slice assertion — every finding fixed.

### 9. Final response

After the reviewed `change-contract.md` exists, rerun `progress --feature <slug> --json`. For an immediate `contract-issue` winner, confirm the frontier advances and `get-issue --next` reports `contracted: true` / `nextAction: implement`. For a contract-ahead winner, confirm `get-issue --next-contract` no longer returns that issue; the immediate frontier may remain unchanged. Do not persist a separate contract-stage flag or manually edit issue state.

Report only:

- Feature + issue contracted, and the `change-contract.md` path.
- Soft-scope file count, hard-wall count, seam count.
- The issue's `Method` carried into the contract.
- Fresh-eyes review passed (note any findings it caught and how they were fixed).
- Recommended next skill from the immediate `progress` frontier; use `jz-implement-contract` for `implement-issue`, or re-invoke this skill on the next `get-issue --next-contract` winner when preparing another contract ahead.

Do not paste the whole contract into chat unless the user asks.

## Hard constraints

- Scope **one** issue per run — the one named, the immediate `contract-issue`, or the `get-issue --next-contract` winner. Do not contract the whole milestone.
- **Read-only on code.** Writes only `change-contract.md`. Never edits source, tests, or config.
- Ground every soft-scope path in a file that exists (or a new file whose directory exists); ground every hard wall in a stable interface or invariant the SPEC actually states. No invented paths, no speculative walls.
- Every seam has ≥2–3 **triangulating** acceptance cases with independently-sourced expected values — a hardcoded return must not pass. Tests live at seams (public boundaries), never against internals (`tdd`).
- An acceptance case asserts only behaviour the issue's own slice or a transitive blocker delivers.
- Carry the issue's `Method` verbatim; the contract does not re-decide risk.
- Verify the contract with a **fresh subagent** before finishing (step 8). Do not self-review the scope you just drew.
- The cage is bendable: hard wall → stop and `ScopeExpansionRequest`; soft scope → edit freely. Small in-scope additions do not need a request.
- Small-team bar (root `CLAUDE.md`): the contract constrains bad choices without enterprise ceremony.

## Supporting references

- `references/scoping-heuristics.md` — the bendable-cage model, hard-wall vs soft-scope rules grounded in SPEC sections, seams and triangulation (from `tdd`), the `Method` risk-carry, and the escalation / `ScopeExpansionRequest` rules.
- `references/contract-format.md` — the exact `change-contract.md` template (markdown, no YAML), a worked example, and the `ScopeExpansionRequest` stub.
