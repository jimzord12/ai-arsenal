# Monorepo Work-Item Pipeline

## Purpose

The repository uses a routed, artifact-driven workflow for monorepo changes.
It preserves resumable context, explicit approval, and independently verifiable
handoffs without replacing the consumer `.scratch/features/` workflow.

## Normal Route

Start with `orchestrate-monorepo-work`. It is read-only and selects the
earliest eligible stage from `NEXT.md` and validated work-item artifacts:

```text
capture → orient → scope → plan → explicit approval → record approval
→ implement → verify → reconcile
```

A direct user request to revise the active current contract or plan enters
`request-monorepo-revision`. It records `revision-request.md`, changes no
product state, and routes to scope or planning; it is never inferred from
ordinary routing or a failed verification.

The complete stage contracts, artifacts, revisions, approval digest, and stop
conditions are normative in
[`MONOREPO_WORK_ITEM_PIPELINE.md`](MONOREPO_WORK_ITEM_PIPELINE.md).

## Resume and Repair

`NEXT.md` records one active work item and its pipeline step. A valid active
item is routed by the validator; no active item remains idle until the user
describes a new monorepo change.

Malformed active metadata, stale approval, invalid artifact revisions, or
other structural corruption route to `initializing-living-plan-workflow`.
That repair skill preserves history, restores only confirmed metadata, runs
both validators, and returns to the router. It does not infer user intent or
advance a stage.

## Legacy Compatibility

`executing-living-plan-phase` redirects legacy phase-execution instructions to
the router. `reconciling-living-plan` is reserved for verified legacy-plan
repair; normal passed work items use `reconcile-monorepo-change`.

## Boundaries

The normal pipeline ends after reconciliation. Release, packing, publication,
global installation, source deletion, and consumer `.scratch` work remain
outside it and keep their existing approval rules.
