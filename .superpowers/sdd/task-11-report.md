# Task 11 Report: Governance, Documentation, and Existing Skills

## Scope

Integrated the approved monorepo work-item pipeline into repository guidance,
the operator view, canonical planning, legacy compatibility skills, and the
living-workflow validator. No work item was created and no consumer
`.scratch/features/` state, release, distribution, or Git history was changed.

## RED

Three independent read-only baseline scenarios found the expected legacy gaps:

- `initializing-living-plan-workflow` had no work-item metadata repair route,
  validator confirmation, or router return.
- `executing-living-plan-phase` could broadly execute a phase without routing
  through `orchestrate-monorepo-work`.
- `reconciling-living-plan` reconciled normal work itself instead of redirecting
  a passed active item to `reconcile-monorepo-change`.

The new `scripts/validate-living-workflow.test.mjs` initially failed three
invalid-fixture cases because the validator did not require the pipeline guide,
nine normal skills, active-item fields, or root skill references. A later
fixture update also failed because the validator still expected the retired
canonical-plan section title.

## GREEN

- The validator now requires the pipeline guide, all nine normal skill files,
  valid skill frontmatter, active-item fields, and root references to the
  router plus every write-capable stage.
- The root contract and workflow overview define the router-first sequence and
  structural-repair stop; `NEXT.md` has explicit `none` active fields while
  preserving pipeline implementation as the current action and CI confirmation
  as deferred follow-up.
- The canonical plan records the work-item workflow, consumer-boundary
  invariant, normal reconciliation ownership, structural repair, and legacy
  compatibility roles.
- Independent follow-up scenarios confirmed each revised legacy skill now
  routes correctly.

## Verification

- `node --test scripts/validate-living-workflow.test.mjs` — exit `0`, 5/5
  tests passed.
- `pnpm test:workflow` — exit `0`, 11/11 work-item validator tests passed.
- `pnpm validate:workflow` — exit `0`; living workflow passed with 16 required
  files and `--work-item none` returned valid no-active-item JSON.
- `pnpm format:check` — exit `0`.
- `git diff --check` — exit `0`.

## Plan Correction

The approved Task 11 wording incorrectly retained CI confirmation as the
immediate action even though commit `7c0a072` had already made pipeline
implementation the approved `NEXT.md` priority. The plan now correctly keeps
CI confirmation as the deferred follow-up after pipeline verification and
reconciliation. The validator also rejects a root contract that retains the old
broad phase-execution loop or directs normal work to
`reconciling-living-plan`.

## Concerns

None. Task 12 and Task 13 remain before maintenance-phase reconciliation.
