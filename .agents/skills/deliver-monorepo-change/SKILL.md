---
name: deliver-monorepo-change
description: Use when a Workflow v2 work item has passed final verification and needs planning reconciliation, closure, and authorized Git delivery.
---

# Deliver Monorepo Change

Validate the active compact item and require its exact registered
`<repository-parent>/<repository-name>.worktrees/<work-item-id>` checkout and
`work/<work-item-id>` branch, recorded passing final verification,
`Review status: passed`, and a concrete
`Review snapshot: sha256:<64 lowercase hexadecimal characters>`. Reconcile the canonical plan to
verified current truth without changelog prose, but keep the compact item
active at `Stage: deliver` and keep `NEXT.md` routed to this skill until every
delivery obligation is evidenced. A required CLI item must use one structured
`## Delivery evidence` record covering Delivery result, Artifact-bearing commit,
Remote ref equality, Required CI, Package, Tarball, Global replacement,
Installed-shim smoke, Installed artifact provenance, Rollback, and Clean
worktree; pending, failed, missing, or inconsistent evidence cannot close it.
Ordinary non-CLI work remains exempt.

For ordinary source work, commit and push the exact verified attributable
snapshot to the matching work branch and observe required CI. For CLI behavior work governed by the root
versioned local-delivery rules, use this bounded two-step sequence:

1. Commit and push the reviewed implementation snapshot, then require its
   applicable CI to pass.
2. Pack that exact artifact-bearing CI-green commit, perform the authorized
   global replacement and independent shim smoke, and collect its checksum,
   version, rollback, commit, remote-equality, and CI evidence.
3. Record that immutable evidence in the compact item. This later evidence-only
   closure does not change the package snapshot and therefore does not require
   repacking it.
4. Only then mark the compact item `Status: delivered`, clear both active fields
   to `none`, commit and push the closure records, and observe the applicable
   documentation/workflow checks.

Never mark an item delivered or clear its active route before a required
post-CI pack/install/smoke operation has actually succeeded. A closure commit
records the artifact-bearing commit; it is not required to contain its own SHA.

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

Inspect each attributable diff and commit with a Conventional Commit. Push the
matching work branch only when the user and compact non-goals allow it; merging
or deleting that branch is outside delivery. The active `NEXT.md` route is local
to this worktree and clears to `none` before closure, so independently delivered
branches do not cross-route when later merged. An external integrator merges
already-delivered branches sequentially, reconciling any shared planning-file
conflict and rerunning only invalidated checks. Worktree removal or pruning is
not delivery automation: it is dangerous deletion and requires fresh direct
confirmation.
Never turn routine commit/push into an approval prompt. Never release, publish,
globally install, or perform dangerous deletion unless the bounded item
explicitly includes the applicable rules. A complete in-scope CLI delivery uses
`Approval: not-required`: after its exact artifact CI passes, global replacement
does not require a separate user approval prompt. Dangerous deletion, registry
publication, source deletion, destructive Git operations, and unrelated external
mutations retain their separate authority boundaries.
