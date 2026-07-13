### Task 10: Write `reconcile-monorepo-change`

**Files:**

- Create: `.agents/skills/reconcile-monorepo-change/SKILL.md`
- Create: `.agents/skills/reconcile-monorepo-change/agents/openai.yaml`
- Create: `.agents/skills/reconcile-monorepo-change/references/reconciliation-contract.md`

**Interfaces:**

- Consumes: passed verification and every current active artifact.
- Produces: `reconciliation.md` status `passed`, updated canonical plan,
  `NEXT.md`, and active-work-item completion state.

- [ ] **Step 1: Preserve reconciliation discipline.**

  Port the existing reconciliation contract's current-truth, risk, decision,
  evidence, and 30-second `NEXT.md` requirements. Add the explicit condition
  that verification must be `passed`; failed verification is never
  reconcilable as complete.

- [ ] **Step 2: Close the work item deterministically.**

  Update the active fields in `NEXT.md` to `none` / `none` only after writing
  passed reconciliation evidence. Preserve the next action derived from the
  canonical plan; do not manufacture a new work item.

- [ ] **Step 3: Validate the completed state.**

  Run the validator and require `valid: true` with `nextSkill: null` and a
  completion status. Run `node scripts/validate-living-workflow.mjs`.
