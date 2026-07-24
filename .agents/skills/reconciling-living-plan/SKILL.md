---
name: reconciling-living-plan
description: Use when a legacy canonical-plan repair is required outside a normal active monorepo work item, or when verified discoveries materially invalidate the legacy living-plan records.
---

# Reconcile a Legacy Living Plan

## Routing Gate

For normal monorepo work, this skill is not the reconciliation executor. Read
root and scoped `AGENTS.md` files, `NEXT.md`,
`docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, and the applicable canonical
plan section. Before selecting a legacy repair, confirm that `NEXT.md` has
exactly one readable `Active work item` field and one readable `Pipeline step`
field. A valid active registration belongs to `orchestrate-monorepo-work`.

Treat either field being missing, unreadable, duplicated, malformed, or
inconsistent as structural corruption, never as no active work item. Stop,
select `initializing-living-plan-workflow`, and do not edit planning records.
Only treat the repository as having no active item after both metadata values
are explicitly `none` and this command reports `valid: true`:

```powershell
node scripts/validate-monorepo-work-item.mjs --work-item none --json
```

When the validator-backed route is `reconcile-monorepo-change`, redirect to
that skill. It alone may record reconciliation evidence, update the canonical
plan and `NEXT.md`, and clear active registration after passed verification.
Do not duplicate that work, reinterpret failed verification, or bypass the
router's structural-repair stop.

## Legacy Repair Scope

Use this skill only after the validated no-active-item gate passes and a
verified legacy planning discovery requires canonical-plan repair. Read
`AGENTS.md`, `NEXT.md`, the canonical plan, relevant evidence, Git
diff/commits, and the applicable acceptance criteria. Confirm the change is
not a normal work item before editing.

1. Classify each discovery as verified fact, user-locked change, technical
   correction, new risk, scope change, or open decision.
2. Rewrite affected current-truth sections without turning the canonical plan
   into a changelog. Update `NEXT.md` with one exact next action derived from
   verified reality.
3. Record concise repair evidence under `docs/evidence/<phase-id>/`, run
   `node scripts/validate-living-workflow.mjs`, and preserve any required
   approval gate.

## Boundaries

Stop and ask the user before changing user-locked requirements, public
behavior or persisted schemas, major dependencies/services, material scope,
cost, security, privacy, operations, distribution direction, source deletion,
or user data. Do not create or mutate a normal work-item artifact, implement
product changes, invoke `features-cli`, release, pack, publish, globally
install, or mutate Git history.

## Completion

For a normal active item, stop after the redirect. For a verified legacy
repair, report the current-truth updates, validation result, exact `NEXT.md`
action, and any approval needed.
