---
name: capture-monorepo-change
description: Use when an explicit, normal-pipeline AI Arsenal monorepo change request needs its first work item and no active work item exists.
---

# Capture Monorepo Change

## Overview

Capture turns one explicit user request into the pipeline's first durable
artifact. It records supplied facts and open questions; it does not design,
scope, approve, implement, or broaden the request.

## Preconditions

1. Read the root `AGENTS.md`, applicable nearer instructions, `NEXT.md`, the
   referenced canonical-plan section, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`,
   and `docs/workflow/templates/work-item/request.md`.
2. Confirm the request is an explicit change within the normal monorepo
   pipeline. Release, packing, publishing, global installation, and source
   deletion are outside capture; stop and use their governing rules instead.
3. Confirm `NEXT.md` has exactly one readable `Active work item` field and one
   readable `Pipeline step` field, both `none`. If either field is absent,
   duplicate, malformed, or names active work, stop; do not infer a no-item
   state or replace it.
4. Run the no-active validation before writing:

   ```powershell
   node scripts/validate-monorepo-work-item.mjs --work-item none --json
   ```

   Continue only when the JSON says `valid: true` and the registration agrees.

## Capture Contract

### 1. Select the identity

Derive the work-item ID as `YYYY-MM-DD-<lowercase-kebab-slug>` from the user
request: use the capture date and a concise lowercase-kebab summary. Check the
exact target directory `docs/work-items/<id>/` before creating anything.

If it already exists, stop for user direction. Do not overwrite, reuse,
enumerate a replacement, or append a suffix autonomously.

### 2. Create the request artifact

Create only `docs/work-items/<id>/request.md`, using the request template's
headings and this exact revision-one header:

```markdown
Work item: <id>
Artifact: request
Revision: 1
Prerequisites: none
Status: ready
```

Fill every template section solely from user-provided facts:

| Template section           | Capture rule                                               |
| -------------------------- | ---------------------------------------------------------- |
| `# Request`                | State the explicit request faithfully.                     |
| `## Desired outcome`       | State only the user-described outcome.                     |
| `## Constraints`           | List supplied constraints, or `None supplied.` exactly.    |
| `## User-provided context` | Record supplied context and explicit unanswered questions. |

Unknown details belong as questions in **User-provided context**. Do not invent
constraints, acceptance criteria, design decisions, priorities, implementation
steps, or approval status. Do not substitute a numbered issue, `issue.md`, or
another artifact type.

### 3. Register only the next stage

After the request file exists, change only these two existing values in
`NEXT.md`, preserving its required headings and all other content:

```markdown
**Active work item:** `<id>`
**Pipeline step:** `orient-monorepo-change`
```

Do not edit the canonical plan, create later-stage artifacts, modify product
files, or change any other `NEXT.md` text.

### 4. Validate and report

Run:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
```

Success requires JSON `valid: true` and
`nextSkill: "orient-monorepo-change"`. If validation fails, stop and report
the JSON blocker; do not advance the pipeline or claim capture succeeded.

Report the ID, created request path, next skill, validator result, and every
open question recorded. Ask the user for direction when a collision or missing
precondition prevents capture.

## Common Mistakes

- Treating missing or malformed active registration as `none`; stop for repair.
- Avoiding capture because product details are unknown; record those as
  questions instead.
- Creating `issue.md`, an implementation plan, or a numbered item; capture
  creates only revision-1 `request.md`.
- Solving a directory collision with a suffix or overwrite; only the user can
  choose the next identity.
- Updating the canonical plan or unrelated `NEXT.md` content during capture.
