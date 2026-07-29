---
name: record-monorepo-approval
description: Historical Workflow v1 compatibility reference only; never use for new work.
---

# Record Monorepo Approval

> **Historical Workflow v1 Compatibility:** Never use this skill for new work.
> Workflow v2 records dangerous-work approval directly in `work-item.md`.

Retain this stage and `approval.md` name for pipeline compatibility. Its routine purpose is to record an autonomous, digest-bound authorization decision—not to ask the user for permission.

## Preconditions

1. Read root `AGENTS.md`, nearer instructions, `NEXT.md`, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, the current contract and plan, and the approval template.
2. Confirm `NEXT.md` names the same active work item and `record-monorepo-approval`.
3. Run:

   ```text
   node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
   ```

   Continue only when JSON is valid and routes to `record-monorepo-approval`.

4. Confirm the current ready plan names the current contract and `approval.md` does not already exist. Derive the next contiguous approval revision from preserved archives.

## Classify Authority

Use `Approved by: autonomous-agent` and continue without a user prompt when the plan is bounded by the contract and no escalation condition exists.

When the classified plan contains dangerous deletion or similarly irreversible
data loss, obtain direct user authorization for the exact digest at Stage 5 so
the work item can enter implementation. Use `Approved by: user` and preserve the
user's wording in `Approval source`. This plan authorization does not replace the
second, fresh confirmation required immediately before the exact destructive
operation by `implement-monorepo-change`.

Escalate as blocked rather than writing authorization when a hard requirement cannot be satisfied honestly, including:

- missing credentials or access required for mandatory live/E2E verification;
- contradictory authority that cannot be resolved from current repository sources;
- a technically impossible requirement or unavailable mandatory external dependency.

Do not replace required live/E2E evidence with mocks, skip it, weaken the contract, or turn routine uncertainty, failed tests, review findings, plan revisions, commits, pushes, or recoverable in-contract operations into permission stops.

## Record Digest Authorization

Calculate SHA-256 over the exact UTF-8 bytes of the current plan:

```text
node -e "const fs=require('node:fs'); const {createHash}=require('node:crypto'); console.log(createHash('sha256').update(fs.readFileSync(process.argv[1])).digest('hex'))" "docs/work-items/<id>/implementation-plan.md"
```

Create `docs/work-items/<id>/approval.md` with:

```markdown
Work item: <id>
Artifact: approval
Revision: <next revision>
Prerequisites: plan@<current revision>
Status: approved

Approved plan SHA-256: `<digest>`
Approved by: `<autonomous-agent|user>`
Approval source: `<policy:ai-arsenal-autonomy-v1 or verbatim direct approval>`
```

For autonomous authorization use the exact machine-checkable source
`policy:ai-arsenal-autonomy-v1`. Do not change plan bytes after hashing. A byte
change invalidates authorization and routes through a fresh record automatically
unless an escalation condition exists.

## Advance and Validate

Change only the existing `NEXT.md` pipeline step to:

```markdown
**Pipeline step:** `implement-monorepo-change`
```

Run the validator again. Success requires `valid: true` and `nextSkill: "implement-monorepo-change"`.

## Boundary

This stage may write only the current `approval.md` and the existing `NEXT.md` pipeline-step value. It does not implement the plan. Never invent direct user approval, authorize dangerous deletion autonomously, or conceal a missing hard prerequisite.
