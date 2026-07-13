---
name: record-monorepo-approval
description: Record a user's direct current-conversation approval of the active ready monorepo implementation plan.
---

# Record Monorepo Approval

Use this skill only after the user directly approves the current active work
item's implementation plan in this conversation. It records that approval as a
durable, digest-bound planning artifact; it does not implement the plan.

## Preconditions

1. Read root `AGENTS.md`, every nearer applicable instruction, `NEXT.md`, its
   referenced canonical-plan section,
   `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, the ready
   `implementation-plan.md`, and
   `docs/workflow/templates/work-item/approval.md`.
2. Confirm `NEXT.md` has exactly one active-work-item block naming the same
   `<id>` as `implementation-plan.md`, and exactly one pipeline step,
   `record-monorepo-approval`.
3. Confirm the user has directly approved implementation of this exact current
   plan in the current conversation. Ask a direct approval question and stop
   when approval is absent or ambiguous. A request for a summary, a question,
   acknowledgement, lack of objection, silence, or approval of an earlier or
   different plan is not approval. Do not infer, paraphrase into approval, or
   reuse approval after any plan-byte change.
4. Run the preflight validator from the repository root:

   ```powershell
   node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
   ```

   Continue only when JSON says `valid: true`, `nextSkill: null`, and its
   blocker says explicit user approval of the current implementation plan is
   required. Otherwise stop, report the JSON blocker, and recommend
   `initializing-living-plan-workflow` for structural state; do not repair,
   write, or change the active registration.

5. Confirm `implementation-plan.md` is the ready revision-one plan with
   `contract@1`, and that `approval.md` does not already exist. This stage
   creates only approval revision 1; it never overwrites, archives, or creates
   a later revision.

## Record the Direct Approval

Calculate the SHA-256 over the exact UTF-8 bytes of the current plan. With
Node, read the plan as bytes rather than normalizing its text:

```powershell
node -e "const fs=require('node:fs'); const {createHash}=require('node:crypto'); console.log(createHash('sha256').update(fs.readFileSync(process.argv[1])).digest('hex'))" "docs/work-items/<id>/implementation-plan.md"
```

Create only `docs/work-items/<id>/approval.md` from the approval template with
this exact header:

```markdown
Work item: <id>
Artifact: approval
Revision: 1
Prerequisites: plan@1
Status: approved
```

Below the header, write these three fields exactly once and no additional
approval fields:

```markdown
Approved plan SHA-256: `<computed 64 lowercase hexadecimal digest>`
Approved by: `user`
Approval source: `<verbatim direct current-conversation approval wording>`
```

The approval source must preserve the user's direct approval wording, not a
summary request, question, agent statement, or invented authorization. Do not
change the plan after calculating the digest. If its bytes change before the
post-write validator succeeds, remove the incomplete approval artifact only
when doing so is needed to restore the pre-write state, report the changed
plan, and request fresh explicit approval; never update the digest silently.

## Validate the Implementation Route

After the complete approval record exists, change only the existing `NEXT.md`
pipeline-step value to:

```markdown
**Pipeline step:** `implement-monorepo-change`
```

Preserve the active work-item value, required headings, and every other
`NEXT.md` byte. Then run:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
```

Success requires JSON `valid: true` and
`nextSkill: "implement-monorepo-change"`. If any value differs, report the
JSON blocker and stop. Do not implement, change product files, or advance a
later stage from this skill.

## Boundary

The only permitted mutations are the revision-one
`docs/work-items/<id>/approval.md` for the active work item and, after the
approval artifact is complete, the one existing `NEXT.md` pipeline-step value.
Do not edit product source, tests, package metadata, product documentation,
the canonical plan, the implementation plan, contract, other work-item
artifacts, or any other `NEXT.md` content. Do not invoke `features-cli`,
inspect or mutate consumer `.scratch` state, perform release, packing,
publishing, global-install, or source-deletion actions, or commit, amend,
push, or otherwise mutate Git history.

## Common Mistakes

- Treating a summary request, question, acknowledgement, silence, lack of
  objection, or a prior-plan approval as direct approval.
- Hashing normalized text instead of the exact current plan bytes, or changing
  the plan after computing the digest.
- Writing an approval header other than revision 1, `plan@1`, and `approved`,
  or writing any approval field more than once.
- Advancing `NEXT.md` before a complete approval record and valid validator
  result, or changing anything other than its existing pipeline-step value.
- Implementing the plan, writing another artifact, or making release,
  distribution, global-install, source-deletion, consumer-state, or Git
  history changes in this stage.
