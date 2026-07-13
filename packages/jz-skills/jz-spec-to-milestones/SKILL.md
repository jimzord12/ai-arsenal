---
name: jz-spec-to-milestones
description: Group a feature's SPEC.md into demoable, end-to-end milestones (a lightweight milestone DAG). Stage 2 of the SPEC → milestones → issues → contract → implement pipeline.
disable-model-invocation: true
---

# Spec to Milestones

## Purpose

Turn a completed `SPEC.md` into a lightweight **milestone plan**: the SPEC's requirements grouped into demoable, end-to-end increments, ordered as a shallow DAG. Each milestone is a slug that becomes the `Milestone:` tag on the issues stage 3 writes.

This skill plans only. Do not write issues or implement code.

Stage 2 of the pipeline: `jz-write-spec` → **milestones** → `jz-milestone-to-issues` → `jz-issue-to-contract` → `jz-implement-contract`.

## Feature progress preflight

Run `features-cli progress --feature <slug> --json` first. Stop without mutation for `migration-required` or `archived`. Activate `todo`/`paused` automatically only when no feature is current; if another feature is current, stop for approval and then use the atomic `update-feature <slug> --status in-progress --pause-current` command. Proceed at `plan-milestones`, or on an explicit regeneration request; otherwise stop and name the skill that owns the reported frontier. Treat every required CLI failure as a hard stop.

## Core rule

A milestone is the smallest thing you can **demo**.

- **Demoable end-to-end.** Someone can run the app (or a flow, or a test) and _see it work_. If you cannot state a one-sentence demo, it is not a milestone.
- **Grouped by user-demoable value, never by architectural layer.** "Build the storage layer" is a horizontal slice — it demos nothing on its own. Fold each layer into the vertical increment that first needs it.
- **A milestone owns its trigger.** The button, screen, or entry point that fires the demo is part of the same vertical — never stranded in a later milestone while the machinery ships earlier. That strand is the horizontal-slice smell wearing a UI hat.
- **Collapsible.** A small SPEC may be a single milestone — write one and stop. Do not manufacture a DAG for ceremony (small-team bar, root `CLAUDE.md`).
- **Coarser than an issue.** Stage 3 breaks each milestone into issues (Matt's tracer-bullet vertical slices); a milestone is several of those. If a milestone is only one issue's worth of work, it is probably too fine.

## Required input

The SPEC is self-contained by design (stage 1). Work from it alone:

```text
.scratch/features/<NNN>-<slug>/SPEC.md
```

Read it fully and locate:

- **Functional requirements** (`FR-NNN`) and **non-functional requirements** (`NFR-NNN`) — the coverage set.
- **User scenarios** (§ _User/Product Behavior Requirements_) — each demoable scenario is a candidate milestone seam.
- **Locked decisions** (`DEC-NNN`, `SUBDEC-NNN`) and **Open Questions** (`QUE-NNN`) with their defaults.

You should not need to explore the codebase. If the SPEC forces you to, that is a stage-1 gap — note it in the final response and plan from the SPEC as written.

## Output location

Append a fenced `## Milestones` section to the SPEC (single source of truth):

```text
.scratch/features/<NNN>-<slug>/SPEC.md
```

If a `## Milestones` fenced block already exists, replace it in place — never leave two. Preserve valid decomposition timestamps for unchanged slugs. Before removing or renaming a timestamped milestone, stop and obtain human approval. Bump the SPEC's `updated_at`. One SPEC per feature folder; do not create a second file. Format is in `references/milestone-format.md`.

## Workflow

### 1. Announce and read the SPEC

Start with:

```text
I'm using the jz-spec-to-milestones skill to group this SPEC's requirements into demoable, end-to-end milestones.
```

Then read `SPEC.md` and enumerate the coverage set.

**Done when** you can list every `FR-`/`NFR-` id, every user scenario, and every open question.

### 2. Draft milestones by demoable value

Read `references/grouping-heuristics.md`. Group the coverage set into milestones — each a demoable end-to-end increment. Apply the demoable test and the horizontal-slice smell to every candidate. Collapse to a single milestone when the SPEC is small.

**Done when** each milestone has a one-sentence demo and a kebab-case slug, and no milestone is a pure layer.

### 3. Order the milestone DAG

For each milestone, set `DependsOn` (by slug; `none` if independent). Keep it shallow — add a dependency only where one milestone genuinely cannot be demoed before another delivers its capability.

**Done when** there is no cycle and every `DependsOn` names a real milestone slug.

### 4. Quiz the user (blocking only)

Present the milestone list (slug, demo, delivers, DependsOn). Ask only genuinely blocking questions about boundaries or ordering — one at a time (e.g. "these two could be one milestone or two — which fits how you'll demo?"). Skip this when the grouping is unambiguous; do not batch questions.

**Done when** the user has resolved every blocking ambiguity, or there was none.

### 5. Coverage check (exhaustive)

Build the coverage table: every `FR-` and `NFR-` id maps to the milestone that delivers it. Most map to exactly one. Two exceptions, each shown explicitly:

- a **cross-cutting NFR** — a constraint honoured everywhere (mark it `cross-cutting`);
- a **bundled FR** — one id that packs several demoable behaviours (e.g. a Send button + a Clear button + flag-gating under one FR). Let it split across milestones, each row naming the part it delivers. Never let "keep the FR in one piece" override "keep the vertical in one piece."

**Done when** every `FR-`/`NFR-` id from step 1 appears in the coverage table, zero ids are unassigned or silently dropped, and any id appearing under more than one milestone is either a marked `cross-cutting` NFR or a bundled FR whose split is explicit. If an id has no home, fix the grouping — do not drop it.

### 6. Write the milestone plan

Read `references/milestone-format.md`. Append (or replace in place) the fenced `## Milestones` section in `SPEC.md`, and bump `updated_at`.

**Done when** `SPEC.md` holds exactly one `## Milestones` fenced block with kebab-case, tag-friendly slugs and the coverage table.

Run `features-cli progress --feature <slug> --json` after writing and confirm the frontier advances without warnings caused by malformed milestone state.

### 7. Final response

Report only:

- SPEC path and new `updated_at`.
- Milestone count and slugs, in dependency order.
- Coverage passed (every `FR-`/`NFR-` mapped once).
- Open questions carried forward, if any.
- Recommended next skill: `jz-milestone-to-issues`.

Do not paste the whole plan into chat unless the user asks.

## Hard constraints

- Plan only. Do not write issues or implementation code.
- Milestones are demoable increments, never architectural layers.
- Do not drop or invent requirement ids; every `FR-`/`NFR-` is fully covered. Most map to one milestone; a `cross-cutting` NFR or a **bundled FR** (one id packing several demoable behaviours) may span milestones, shown explicitly in the coverage table.
- Do not force a multi-milestone DAG on a small SPEC; one milestone is a valid plan.
- Slugs are kebab-case and tag-friendly — they become the `Milestone:` tag on issues.
- Ask blocking questions only, one at a time.
- Preserve SPEC decision ids verbatim (`DEC-`/`SUBDEC-`); carry the SPEC's open-question defaults, don't reopen them.

## Supporting references

- `references/grouping-heuristics.md` — the demoable test, the horizontal-slice smell, collapsing, DAG ordering, NFR and open-question handling, sizing.
- `references/milestone-format.md` — the exact `## Milestones` output block and a worked example.
