---
name: deliver-monorepo-change
description: Use when a Workflow v2 work item has passed final verification and needs planning reconciliation, closure, and authorized Git delivery.
---

# Deliver Monorepo Change

Validate the active compact item and require recorded passing final
verification with no required review findings. Reconcile the canonical plan and
`NEXT.md` to verified current truth without changelog prose. Mark the compact
item `Stage: deliver` and `Status: delivered`, clear both active fields to
`none`.

At the start of each agent turn that resumes this item, increment
`Turns since time check` once. If the increment reaches five, record the
time/scope proportionality check, update `Last time check`, and reset the
counter to zero before continuing. The validator can check only this recorded
value, not unrecorded conversational turns.

Identify which checks the delivery-only edits invalidate and rerun only those
checks. Planning, compact-record, or `NEXT.md` edits require the selected-item
validator, living-workflow validator, and `git diff --check`; rerun formatting
or another gate only when the delivery edit can affect it. Do not rerun the
complete final-verification suite merely because delivery edited its records.

Inspect the final attributable diff and commit with a Conventional Commit. Push
only when the user and compact non-goals allow it.
Never turn routine commit/push into an approval prompt. Never release, publish,
globally install, or perform dangerous deletion unless the bounded item
explicitly includes the applicable rules and approval.
