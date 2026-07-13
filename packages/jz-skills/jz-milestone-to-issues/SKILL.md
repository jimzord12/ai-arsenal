---
name: jz-milestone-to-issues
description: Break one milestone from a feature's SPEC.md into tracer-bullet issues written as features-cli issue files, wired into a blocker DAG. Stage 3 of the SPEC → milestones → issues → contract → implement pipeline.
disable-model-invocation: true
---

# Milestone to Issues

## Purpose

Take **one milestone** from a feature's `## Milestones` plan and break it into **issues** — tracer-bullet vertical slices, each ~1 PR — written as `features-cli` issue files and wired into a blocker DAG. Each issue carries the `Milestone:` tag so the CLI board groups it under `▸ <milestone>`.

This skill plans and writes issue files. Do not implement the feature's code.

Stage 3 of the pipeline: `jz-write-spec` → `jz-spec-to-milestones` → **issues** → `jz-issue-to-contract` → `jz-implement-contract`.

## Feature progress preflight

Run `features-cli progress --feature <slug> --json` first. Stop without mutation for `migration-required` or `archived`. Activate a `todo`/`paused` target automatically only when no feature is current; if another feature is current, stop for approval and then use one atomic `update-feature <slug> --status in-progress --pause-current` call. Proceed only for the reported dependency-ready `decompose-milestone`, or for an explicit regeneration request. Otherwise stop and name the skill that owns the frontier. A required CLI failure is a hard stop.

## Core rule

An issue is a **tracer bullet**: one narrow, COMPLETE path through every layer it touches (data + logic + UI + test), sized to fit a single fresh context window (~1 PR).

- **Vertical, never horizontal.** An issue cuts a thin whole path, not a cross-section of one tier. "Write the storage layer" / "add the schemas" / "wire the API" are horizontal slices — fold each layer into the first issue that needs it. Same smell as at the milestone level, one size down.
- **The milestone is the demo; the issue is a slice of it.** A milestone is demoable end-to-end; its issues compose to that demo. An issue need not be independently demoable, but it must be **verifiable on its own** (a test passes, a seam behaves).
- **Prefactor first.** If the milestone is easier after a mechanical cleanup ("make the change easy, then make the easy change"), that prefactor is its own issue, and the issues that need it are blocked by it.
- **Wide refactors are the exception** — see `references/breakdown-heuristics.md`. A mechanical change whose blast radius breaks thousands of call sites at once can't be a single tracer bullet; sequence it expand → migrate-in-batches → contract.
- **Honor the milestone's `Carries:` open questions.** When a milestone carries a `Q-NNN` that _defers_ concrete enumeration to this stage (exact call sites, not-yet-spelled-out schemas), that enumeration **is** your issue work — turn each deferred item into a concrete issue. Keep the SPEC's default; do not reopen a question the SPEC already answered.

## Required input

Work from the SPEC and its milestone plan — both are self-contained by design (stages 1–2):

```text
.scratch/features/<NNN>-<slug>/SPEC.md
```

You also need **which milestone** to decompose (a slug from the `## Milestones` block). If the user did not name one, offer the next milestone whose dependencies are already decomposed, or ask.

Read and locate:

- The named milestone in the `<!-- milestone-plan:start -->` block: its **Demo**, **Delivers**, **Carries**, **Scope**, **DependsOn**, and `Decomposed` marker.
- Your **exhaustive checklist = the milestone's `Delivers:` line ∪ its Coverage-table rows.** These are not the same set: the Coverage table lists only `FR-`/`NFR-` ids, while the `DEC-`/`SUBDEC-` decision ids live **only** on `Delivers:`. Union them, or the decision ids (often the privacy/sanitization ones) silently escape coverage.
- The `FR-`/`NFR-`/`DEC-`/`SUBDEC-` bodies those ids point to (in the SPEC's decision ledger and §6 contracts), so issue acceptance criteria are concrete and traced to the right id — a decision defined for storage must not be traced onto the summary issue, etc.

You should not need to explore app code to slice. If you must, that is a stage-1/2 gap — note it and slice from the SPEC as written.

## Output location

Write each issue as a **directory-form** file so stage 4's change contract can sit beside it:

```text
.scratch/features/<NNN>-<slug>/issues/<NN>-<issue-slug>/issue.md
```

The `<NN>` prefix **is** the issue id (the CLI derives the id from the leading digits of the directory name — there is no id in the file body). Format and id allocation are in `references/issue-file-format.md`.

## Workflow

### 1. Announce and read the milestone

Start with:

```text
I'm using the jz-milestone-to-issues skill to break the "<milestone-slug>" milestone into tracer-bullet issues.
```

Then read `SPEC.md`, confirm the milestone slug, and pull its Coverage rows + Carries.

**Done when** you can list every requirement id this milestone delivers (the `Delivers:` line ∪ its Coverage rows — including the `DEC-`/`SUBDEC-` ids) and every open question it carries.

### 2. Draft tracer-bullet issues

Read `references/breakdown-heuristics.md`. Slice the milestone's requirements into vertical issues. Apply the horizontal-slice smell to every candidate. Pull any prefactor to the front. Expand a `Carries:` enumeration (deferred call sites / schemas) into concrete issues. Use the wide-refactor expand→migrate→contract sequence only when the blast radius truly forbids a single slice.

**Done when** every requirement id from step 1 is covered by at least one issue, each issue has a one-line "what it delivers / how it's verified", and no issue is a pure layer.

### 3. Assign Method, Complexity, and blocker edges

For each issue set:

- **`Method`** — the risk gate (`tdd-pingpong` / `tdd-solo` / `direct`); pick by risk using the table in `references/breakdown-heuristics.md`. Privacy/sanitization, money, and auth logic lean `tdd-pingpong`; routine logic `tdd-solo`; trivial config/wiring `direct`.
- **`Complexity`** — a positive integer size/ordering signal (roughly: 1 trivial, 2 small, 3 medium, 5 large-but-still-one-PR). If it wants to be bigger, split the issue.
- **`BlockedBy`** — the issues that must be `done` first. Keep it shallow: add an edge only where an issue genuinely cannot start until another delivers its capability.

**Done when** every issue has a `Method`, a positive-integer `Complexity`, and a `BlockedBy` set that names only real, lower-numbered sibling issues (see step 5 on numbering). **Acceptance-criteria consistency:** an issue may only assert behavior its own slice or a transitive blocker delivers. If issue B's acceptance criteria depend on a guarantee issue A establishes (e.g. "capture never throws" is A's deliverable), then B must list A in `BlockedBy` — or drop that criterion. An acceptance criterion an implementer cannot satisfy with only their blockers done is a DAG bug.

### 4. Quiz the user (blocking only)

Present the issue breakdown as a numbered list — for each: **title**, **Method**, **Complexity**, **BlockedBy** (by title), and **what it delivers**. Ask only genuinely blocking questions, one at a time:

- Does the granularity feel right (too coarse / too fine)?
- Are the blocking edges correct — does each issue depend only on issues that genuinely gate it?
- Should any issues merge or split?

Iterate until the user approves. Skip the quiz only when the breakdown is unambiguous; do not batch questions.

### 5. Allocate ids and write the issue files

Read `references/issue-file-format.md`. Allocate ids by scanning existing `issues/` for the highest numeric prefix and continuing (start at 1 for the first milestone). **Number in dependency order — an issue's `BlockedBy` must reference only lower ids** — so the DAG is acyclic by construction (the CLI validates unknown-id references but does **not** detect cycles). Write each `issues/<NN>-<slug>/issue.md` with the `Name: value` metadata block (Status, Method, Complexity, BlockedBy, Milestone) before the `# Title`, and a body of what-to-build + acceptance criteria that trace back to SPEC ids. No stale file paths — scoping files is stage 4's job.

**Done when** every issue file exists in directory form, ids are unique and dependency-ordered, each metadata block is complete, and the **coverage diff passes**: the union of every issue's `Traces:` line ⊇ the milestone's `Delivers:` set (Coverage rows ∪ `Delivers:`). Every id must appear in some issue's `Traces:`, or be **explicitly waived in an issue body** with its reason (e.g. "deferred per QUE-001"). An id that is silently absent is a dropped requirement — fix the slicing or add the trace/waiver. Trace each id to the issue that actually delivers _that_ decision, not merely a nearby one.

### 6. Verify with fresh eyes (subagent review)

Dispatch a **fresh subagent** to review the written issues against the SPEC. Do not self-review — the value is a reader with no drafting context, who has not rationalized the traces you just wrote. This step exists because the coverage gate in step 5 cannot catch a **mis-placed but present** id: a `⊇` diff passes even when a decision id is traced onto the wrong issue (e.g. a _summary_ decision traced onto the _repair_ issue), because the id still appears somewhere. Only checking each id against the SPEC's definition catches that — and a decomposition is high-leverage: every downstream stage inherits its errors.

Give the subagent only the SPEC path, the milestone slug, and the written `issue.md` files. Ask for findings, not praise:

```text
You are reviewing a decomposition of the "<milestone-slug>" milestone into issue files, against <SPEC path>. You did not write these issues. Do not praise them. Report only problems, most severe first:

1. Coverage — every id on the milestone's `Delivers:` line ∪ its Coverage-table rows that appears in NO issue's `Traces:` and is not explicitly waived in an issue body.
2. Trace accuracy — for every `Traces:` id, check it against the SPEC's definition of that id. Flag any id traced onto an issue whose behavior does NOT match what the SPEC says that id is.
3. Acceptance consistency — any acceptance criterion asserting behavior the issue's own slice or a transitive blocker does not deliver.
4. Slice integrity — any issue that is a horizontal layer (verifies nothing alone) rather than a vertical tracer bullet.

Return concrete findings (issue id, offending id/line, what's wrong). If a category is clean, say so.
```

Fix every legitimate finding inline — correct a trace, move an id to the right issue, add a blocker or an explicit waiver, or re-slice. Re-dispatch the review if the fixes were substantial. If the harness genuinely has no subagent capability, do the same four checks yourself in a deliberate second pass, reading each id's SPEC definition rather than trusting your draft — but a fresh subagent is strongly preferred.

**Done when** the review reports no unresolved coverage gap, no mis-traced id, no unsatisfiable acceptance criterion, and no horizontal slice — every finding fixed or explicitly waived with a reason.

### 7. Build and validate the DAG

For each issue, run `update-blockers <id> --blockers <none|id[,id...]>` (exact command, cwd, and `--feature` handling in `references/issue-file-format.md`). This normalizes the `BlockedBy` line and validates that every blocker references a real issue. Then run `sync-issues --feature <slug>` explicitly.

**Done when** `update-blockers` succeeds for every issue with no unknown-blocker error and `issues-status.json` is regenerated.

### 8. Confirm and mark decomposition

After the fresh decomposition review, blocker validation, and issue synchronization all pass, run `progress --feature <slug> --json`. Then run `mark-milestone-decomposed <milestone-slug> --feature <slug>` and rerun progress. Never infer completion from issue tags alone, and never mark after a failed review, blocker check, sync, or progress command.

**Done when** the SPEC contains the marker command's ISO timestamp, progress reports the expected next frontier, and `get-issue --next --feature <slug>` returns the expected first issue with `contracted: false` and `nextAction: contract`.

### 9. Final response

Report only:

- Feature + milestone decomposed.
- Issue count, with ids, slugs, Method, and blocker edges in dependency order.
- Coverage confirmed (every requirement the milestone owns lands in an issue), and the fresh-eyes review passed (note any findings it caught and how they were fixed).
- Open questions carried / enumerated, if any.
- The `get-issue --next` winner and its `nextAction`.
- **Milestone progress across the SPEC** — report the explicit timestamp/pending state returned by `features-cli progress`; issue tags are descriptive and never decomposition authority.
- Recommended next skill: follow the winner's `nextAction` (`contract` → `jz-issue-to-contract`, `implement` → `jz-implement-contract`), or re-invoke this skill on the next pending milestone.

Do not paste every issue body into chat unless the user asks.

## Hard constraints

- Decompose **one** milestone per run — the one named (or agreed). Do not silently break the whole SPEC.
- Issues are tracer-bullet vertical slices, never architectural layers.
- Cover every id in the milestone's `Delivers:` ∪ Coverage rows; drop or invent nothing. The union of all issues' `Traces:` must ⊇ that set, each id traced to the issue that delivers _that_ decision (not a neighbour), or explicitly waived in an issue body with its reason.
- Verify the written issues with a **fresh subagent** before touching the CLI (step 6). Do not self-review the traces you just wrote; a `⊇` coverage diff cannot catch a mis-placed-but-present id — only checking each id against its SPEC definition can.
- Number issues in dependency order; `BlockedBy` references only lower, existing ids. The CLI does not detect cycles — you guarantee the DAG.
- `Method` is enforced here (the CLI is permissive): use only `tdd-pingpong` / `tdd-solo` / `direct`, picked by risk.
- No stale file paths or code snippets in issue bodies (that goes stale; it is stage 4's job). Exception: a decision-encoding snippet from a proven spike, trimmed to the decision.
- Honor the milestone's `Carries:` defaults; enumerate deferred call sites/schemas as issues; do not reopen answered questions.
- Small-team bar (root `CLAUDE.md`): the fewest issues that each stand up as a verifiable slice. No speculative issues for edge cases the SPEC deferred.

## Supporting references

- `references/breakdown-heuristics.md` — the tracer-bullet slice rules, the horizontal-slice smell at issue level, the wide-refactor expand/contract exception, the `Method` risk-gate, Complexity sizing, blocker-DAG rules, and Carries handling.
- `references/issue-file-format.md` — the exact `features-cli` issue-file contract, id allocation, the write → `update-blockers` → verify mechanic with exact commands, and a worked example.
