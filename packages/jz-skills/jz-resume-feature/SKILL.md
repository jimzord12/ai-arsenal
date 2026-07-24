---
name: jz-resume-feature
description: Report the current Spec-to-Ship feature state and recommend the next workflow skill.
---

# Resume Feature

## Purpose

Orient a new session from canonical `features-cli` state. This workflow is
read-only: it never activates, pauses, repairs, or otherwise mutates a feature.

## Load canonical state

Run from the repository root.

1. Run `features-cli docs current --json`, adding `--feature <selector>` when
   the user supplied one.
2. Treat the embedded `progress` object as the authority for identity, phase,
   focus, artifacts, milestones, issues, frontier, and warnings. Treat the
   embedded `guidance` object as the authority for the one safe next action and
   recommended skill.
3. When `progress` is `null`, report the no-current-feature guidance and stop.
   When the command fails, report its structured docs error and stop. Do not
   rebuild routing from chat history, Git history, `STATUS.md`, or stale files.

## Render the report

Use this compact shape:

```markdown
## Feature status

Feature: #<id> `<slug>` — <status>, <phase> phase
Current position: `<frontier.kind>` — <frontier.summary>
Focus: `<focusPath>`
Milestones: <decomposed>/<planned> decomposed
Warnings: <none, or every warning code, message, and path>

Recommended next skill: `<guidance.recommendedSkill|none>` — <guidance.recommendedAction>
Safety: <guidance.doNotStart>
```

- Omit `Focus` when it is null and `Milestones` when progress has no milestone
  summary.
- Preserve all warnings from embedded canonical progress.
- Report exactly one recommendation from `guidance`; do not maintain a local
  frontier-to-skill table or add a follow-on workflow.
- For a null recommended skill, state the guidance reason and stop.

## Read-only boundary

The only allowed state query is `features-cli docs current [--feature <selector>]
--json`. Never run lifecycle mutations or edit feature artifacts while using
this skill.
