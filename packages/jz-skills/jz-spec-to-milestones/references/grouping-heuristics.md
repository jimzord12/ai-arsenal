# Grouping heuristics

How to find milestone boundaries in a SPEC. A milestone is a **demoable, end-to-end increment** — the coarser unit that stage 3 will later break into tracer-bullet issues.

## The demoable test

For every candidate milestone, write the one-sentence demo: _"Someone does X and sees Y."_ If you can't — if the only way to describe it is "the code for Z now exists" — it is not a milestone. The demo must be observable end-to-end: run the flow, press the button, watch the record persist, see the request succeed. A passing unit test counts as a demo only when the SPEC has no user-facing surface for that increment.

Use the SPEC's user scenarios (the gherkin `Scenario:` blocks) as seed demos — each one is usually a milestone or a slice of one.

## The horizontal-slice smell

Layer names as milestone titles are the tell: _"storage layer", "config module", "API wrapper", "the schemas"_. These are horizontal slices — a cross-section of one tier that demos nothing alone. Fold each layer into the first vertical increment that needs it. The storage code ships **inside** the milestone that first captures and shows a stored record, not as its own milestone.

A milestone almost always cuts through several layers (data + logic + UI + test) to deliver one narrow, whole path.

**The trigger is a layer too.** The button, screen, or entry point that fires a milestone's demo belongs to that same vertical. Stranding it in a later "UI" milestone while the machinery ships earlier leaves the earlier milestone with nothing to press — the horizontal-slice smell in disguise. If milestone A does the work and milestone B holds the only way to invoke it, they are one vertical wrongly cut in two.

## Bundled requirements

A SPEC sometimes packs several demoable behaviours into one requirement id — e.g. an `FR` that covers a Send button _and_ a Clear button _and_ the flag that gates them. When those behaviours belong to different milestones, **let the vertical win**: split the requirement across milestones and record each part in the coverage table (`FR-0xx (send button) → explicit-send`, `FR-0xx (clear + gating) → manage-and-gate`). Do not distort your milestones to keep one FR in one place — "whole FR" is bookkeeping; "whole vertical" is the rule. If the split is awkward to describe, that is a signal the SPEC's FR is itself over-bundled; note it so a SPEC revision can break the id apart cleanly.

## Collapse to one

Do not decompose for its own sake. When the whole SPEC serves a single demoable outcome, or is small enough that splitting would produce milestones of one issue each, write **one milestone** that delivers everything, `DependsOn: none`. The small-team bar (root `CLAUDE.md`) favours the fewest milestones that still each stand up as a demo. Split only when there are genuinely distinct demoable outcomes a person would want to see land separately.

## Ordering the DAG

- Prefer a **walking skeleton** first: the thinnest end-to-end path that proves the architecture works, even if narrow. Later milestones widen it.
- Add `DependsOn` only where a milestone's demo truly needs another's capability (e.g. "explicit send" needs "capture and store" to have produced records). Do not chain milestones just because they touch the same files.
- Keep the DAG shallow. Deep dependency chains are a sign the milestones are really layers in disguise — re-check the horizontal-slice smell.

## NFRs

Most non-functional requirements are cross-cutting constraints, not deliverables — encryption at rest, "capture never throws", privacy allow-listing. Mark these `cross-cutting` in the coverage table: they are honoured by every milestone that touches the relevant code, not built once.

An NFR that requires its own dedicated work (e.g. a release-build validation script, a performance-budget harness) **is** a deliverable — assign it to the milestone that does that work.

Either way, every NFR id must appear in the coverage table. None is dropped.

## Open questions

Carry the SPEC's `Q-NNN` defaults forward onto the milestone they affect (`Carries:` line). Do not reopen a question the SPEC already gave a safe default for. When a question is explicitly deferred to a later stage (e.g. "which call sites — stage 3"), note it on the milestone so `jz-milestone-to-issues` picks it up, and keep planning at the default.

## Sizing

A milestone is a few issues' worth of demoable work — bigger than one PR, smaller than the whole feature. Two smells:

- **Too fine:** a milestone that is one issue, or whose demo is a sub-step of another milestone's demo. Merge it up.
- **Too coarse:** a milestone whose demo needs three unrelated sentences, or that bundles independent outcomes a user would land separately. Split it on the seam between the demos.
