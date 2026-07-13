---
name: jz-write-spec
description: Turn a feature's design artifacts (grill session, brief, contracts) into a self-contained implementation SPEC.md in its .scratch/features folder. Stage 1 of the SPEC → milestones → issues → contract → implement pipeline.
disable-model-invocation: true
---

# Write SPEC

## Purpose

Create a self-contained implementation-grade SPEC from feature decisions plus evidence gathered from the codebase. The SPEC must give a fresh implementation agent enough product, technical, architectural, testing, and integration context to build the feature without relying on chat history.

This skill produces the SPEC only. Do not implement code while using it.

## Core rule

The SPEC is not a summary. It is an execution contract.

A valid SPEC must make the implementation path obvious, constrain bad choices, and preserve the evidence behind the decisions. It may be large — but size serves the feature, not ceremony. This repo optimizes for a small, inexperienced team (see root `CLAUDE.md`): build the important 80% clearly, defer rare edge cases unless they risk data loss, double charges, fiscal/tax non-compliance, or privacy exposure, and add no speculative hardening. Prune the SPEC template to the sections this feature needs; delete the rest and say why.

Stage 1 of the pipeline: SPEC → `jz-spec-to-milestones` → `jz-milestone-to-issues` → `jz-issue-to-contract` → `jz-implement-contract`.

## Feature progress preflight

Run `features-cli progress --feature <slug> --json` before reading or writing the SPEC. Stop without mutation for `migration-required`, `archived`, or a frontier owned by another skill unless the user explicitly requested SPEC revision. If the target is `todo`/`paused` and no feature is current, activate it. If another feature is current, stop for approval; after approval use one atomic `update-feature <slug> --status in-progress --pause-current` call. A CLI failure is a hard stop.

The feature remains in `phase: design` throughout drafting and review. After `SPEC.md` exists, set focus with `update-feature <slug> --focus SPEC.md`. Only after every quality gate and the fresh implementability review pass, run `update-feature <slug> --phase implementation --focus none`, then confirm the new frontier with JSON progress. This quality-gated transition needs no extra human approval.

## Required inputs

The design phase lives in the feature folder `.scratch/features/<NNN>-<slug>/`. Read all of it:

- `PRD.md` — accepted product scope and user value.
- `DECISIONS.md` — compact accepted decisions. Primary decision input.
- `GRILL_SESSION.md` — provenance fallback when an accepted decision is ambiguous.
- `BRIEF.md` — optional feature framing.
- `OPERATIONS.md` — deployment / ops / retention / cleanup notes.
- `sub-features/<x>/contracts/*.md` — NORMATIVE implementation contracts tied to decision ids. Fold these into the SPEC.
- `sub-features/<x>/examples/*.md` — illustrative snippets.
- `experiments/*.md` — spike evidence (what was validated or rejected, and why).
- The existing codebase: conventions, architecture, tests, lint/build commands, constraints.

If decisions are incomplete, do not stall. Extract what is known, infer reasonable defaults from the codebase, mark assumptions explicitly. Ask only genuinely blocking questions.

## Output location

Write to the feature's workspace:

```text
.scratch/features/<NNN>-<feature-slug>/SPEC.md
```

One SPEC per feature folder. If a `SPEC.md` already exists, revise it in place and bump `updated_at`; do not create a second file. `features-cli` scans for this exact filename (`Has SPEC`).

## Workflow

### 1. Announce and freeze scope

Start with:

```text
I'm using the jz-write-spec skill to turn this feature's design artifacts and codebase evidence into a self-contained implementation SPEC.
```

Then identify:

- feature name
- intended behavior
- explicitly locked decisions
- likely affected subsystems
- known non-goals
- whether this is one feature or should be split

If the requested feature spans unrelated subsystems, recommend splitting into multiple SPECs. Continue with the smallest coherent feature unless the user explicitly asks for one giant cross-cutting SPEC.

### 2. Build the decision ledger

Before exploring code, extract all provided feature decisions into four buckets:

- **Locked decisions** — user/company choices that must not be changed.
- **Open decisions** — choices that are not decided yet.
- **Assumptions** — safe defaults inferred from repo conventions or common practice.
- **Non-goals** — things the implementation must not include.

Preserve exact names, values, thresholds, platforms, libraries, and constraints.

**Canonicalize SPEC symbols.** Source artifacts may reuse local ids (`D-004`, `R-002`, `Q-001`) across parent and sub-feature sessions. Do not reuse those as SPEC ids. Mint stable SPEC-local ids and keep the original id as provenance:

- `DEC-NNN` — accepted/top-level feature decision.
- `SUBDEC-NNN` — accepted subordinate/sub-feature or implementation-contract decision.
- `REJ-NNN` — rejected alternative.
- `ASM-NNN` — assumption.
- `QUE-NNN` — open question.
- `FR-NNN` / `NFR-NNN` — functional / non-functional requirement.
- `EVD-NNN` — repo, document, or spike evidence.

Use `Source` and `Source ID` columns to preserve the original artifact and local id. Do not invent dynamic source prefixes like `SDK-D-*`; the symbol type is stable and the source is metadata.

### 3. Explore the codebase first

Do not write the SPEC from memory. Inspect the repository.

Minimum reconnaissance:

- README and architecture docs
- package manifests and dependency versions
- app entrypoints and routing/navigation
- existing feature modules similar to the requested feature
- state management, data access, API/client patterns
- error handling, logging, analytics, permissions, configuration
- tests, test utilities, mocks, CI commands
- platform-specific files if relevant
- recent commits or existing issue references if available

Create a working map of relevant files and responsibilities. Prefer exact paths and symbols over vague descriptions.

### 4. Dispatch focused analysis subagents

When subagents are available, use them. Dispatch independent analysis in parallel when the domains do not overlap. Never let subagents modify code during SPEC creation.

Read `references/subagent-prompts.md` and choose the smallest set that covers the feature. Common set:

1. Codebase mapper
2. Pattern miner
3. Feature surface analyst
4. Data/contracts analyst
5. Testing analyst
6. Risk/security/performance analyst
7. Migration/backward-compatibility analyst, when relevant
8. Fresh implementability reviewer, after the draft SPEC exists

Each subagent must return:

- exact files/symbols inspected
- relevant conventions found
- recommended implementation approach
- risks and edge cases
- test strategy
- evidence anchors using file paths and line ranges when possible
- unknowns that remain unknown after exploration

If the harness has no subagent capability, perform the same analyst passes sequentially and label them clearly in your notes.

### 5. Synthesize before writing

Merge the user decisions and subagent findings.

Resolve conflicts using this priority:

1. explicit user/company decision
2. existing production behavior
3. existing repo convention
4. current framework/library best practice
5. your assumption, clearly marked

Do not hide disagreements. If evidence conflicts, document the conflict and choose the safest implementation path.

Sub-feature `contracts/*.md` are normative: every contract must surface in the SPEC as a requirement, interface, or invariant carrying its decision id. Examples and spike evidence become evidence anchors.

### 6. Write the SPEC

Use `references/spec-template.md`.

The SPEC must be self-contained:

- It may cite source files for traceability, but it must summarize the needed behavior directly.
- It must not rely on “as discussed earlier,” “see previous chat,” “follow existing pattern” without explaining the pattern.
- It must include exact interfaces, paths, commands, data shapes, state transitions, and acceptance criteria when they are discoverable.
- It must include implementation guidance strong enough that a fresh agent can work from the SPEC alone.

### 7. Run quality gates

Read `references/quality-gates.md` and apply all gates before presenting the result.

Mandatory gates:

- no placeholders
- no unresolved contradictions
- every locked decision is represented
- every requirement has an implementation target and acceptance test idea
- every affected subsystem has current-state evidence
- every proposed new module/interface has a purpose and consumers
- validation commands are exact
- implementation agent does not need chat history

If any gate fails, keep `phase: design` and focus on `SPEC.md`; do not claim the transition completed.

### 8. Fresh implementability review

After drafting the SPEC, dispatch a fresh subagent with no chat history except the SPEC and ask it:

```text
Could you implement this feature from this SPEC alone? List every missing detail, ambiguity, contradiction, risky assumption, or place where you would need to inspect chat history. Do not praise the SPEC. Return blocking issues first.
```

Fix all legitimate issues inline. If a blocker cannot be resolved from the repo or decisions, mark it in `Open Questions / Required Human Decisions` and explain why it blocks implementation.

When the review passes, perform the implementation-phase transition described in the preflight section and verify it with `progress --feature <slug> --json`.

### 9. Final response

Report only:

- SPEC path
- revision
- whether quality gates passed
- major unresolved human decisions, if any
- recommended next skill: `jz-spec-to-milestones`

Do not paste the whole SPEC into chat unless the user asks.

## Hard constraints

- Do not write implementation code.
- Do not create tickets/tasks unless the user asks; this skill writes the SPEC.
- Do not leave “TBD,” “TODO,” “decide later,” or “follow existing pattern” without details.
- Do not treat subagent output as truth. Verify and synthesize it.
- Do not produce a short SPEC for a large feature just to save tokens.
- Do not ask long batches of questions. Ask only blocking questions, one at a time.

## Supporting references

- `references/spec-template.md` — canonical SPEC structure.
- `references/subagent-prompts.md` — focused code-analysis subagent prompts.
- `references/quality-gates.md` — validation checklist and failure rules.
- `references/pressure-tests.md` — scenarios for testing this skill against future agents.
