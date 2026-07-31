# Work Item

Work item: 2026-07-31-review-barrier-integration-docs
Workflow: 2
Stage: review
Status: blocked
Started at: 2026-07-31T20:00:29+03:00
Max time: 4 hours
Last time check: 2026-07-31T20:00:29+03:00
Turns since time check: 3
Review cycles: 4
Review status: failed
Review snapshot: sha256:4e6d6e3148ebc1275a445e0e0a5ad6f568395939d5978fcded7e846128cd1555
Review batch: review-20260731-integration-04
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"failed","batchId":"review-20260731-integration-04","snapshot":"sha256:4e6d6e3148ebc1275a445e0e0a5ad6f568395939d5978fcded7e846128cd1555"},{"reviewer":"quality","outcome":"failed","batchId":"review-20260731-integration-04","snapshot":"sha256:4e6d6e3148ebc1275a445e0e0a5ad6f568395939d5978fcded7e846128cd1555"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Complete GitHub issue #19 by adding an integrated Workflow v2 review-barrier regression matrix and aligning every affected live normative surface so verification and delivery consistently require fresh, snapshot-bound, complete review evidence.

## Non-goals

- Do not redesign or duplicate the deterministic digest algorithm owned by issue #16 or its unit-level coverage.
- Do not redesign or duplicate review-batch reconciliation owned by issue #17 or its unit-level coverage.
- Do not reopen, rewrite, or absorb the delivered scope and audit histories of issues #15 through #18.
- Do not change shipped CLI behavior, create a Changeset, publish or globally install a package, or perform destructive file or Git operations.
- Do not broaden documentation edits beyond the live Workflow v2 template, review skill, validator-facing guidance, normative pipeline contract, and root/living-workflow assertions directly invalidated by the integrated repair.

## Acceptance criteria

- Integrated disposable-repository tests prove that a new or unperformed review cannot enter verification.
- Integrated tests prove that pending review cannot verify and failed review cannot verify.
- Integrated tests prove that incomplete or mismatched batch evidence cannot verify.
- Integrated tests prove that passed review evidence becomes stale when candidate bytes change and unchanged reviewed bytes can verify.
- Integrated tests prove that candidate-changing repair invalidates the prior digest and requires a fresh review before verification.
- Integrated tests prove that active delivery and newly delivered records cannot bypass the review barrier.
- Integrated tests prove that immediately available and later-arriving complete review batches reconcile to equivalent valid state.
- Integrated tests prove that immutable delivered historical records remain readable only under the documented compatibility policy.
- The compact work-item template, `review-monorepo-change`, validator behavior and focused tests, normative Workflow v2 pipeline documentation, and directly affected root/living-workflow guidance use consistent field names, transitions, snapshot definition, evidence requirements, and failure behavior.
- All tests use isolated temporary repositories, all unrelated Workflow v2 tests remain green, and the final reviewed snapshot passes the required repository and workflow verification gates.

## Implementation summary

- Added one integrated disposable-repository lifecycle matrix to `scripts/validate-monorepo-work-item.test.mjs` covering unperformed, pending, failed, incomplete, mismatched, stale, unchanged, repaired, deliver/delivered, immediate/later batch, and immutable-history behavior. The matrix exercises the existing validator, shared snapshot calculator, and shared batch reconciler without duplicating their unit-level algorithms.
- Added a cross-surface contract test that locks the five canonical review fields and the normative snapshot, reset, fail-closed, and exact-hash historical-compatibility rules across root guidance, the compact template, review skill, pipeline documentation, and living-workflow assertions.
- Updated the complete routed-workflow fixture in `scripts/validate-living-workflow.test.mjs` so the synthetic valid authority set satisfies the same semantic contract and continues to exercise the validator's accepted path.
- Aligned `AGENTS.md`, `.agents/skills/review-monorepo-change/SKILL.md`, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, and `docs/workflow/templates/work-item/work-item.md` on those field names and transitions. Extended `scripts/validate-living-workflow.mjs` so future drift fails validation.
- RED: `node --test --test-name-pattern="live Workflow v2 authorities|integrated review-barrier lifecycle" scripts/validate-monorepo-work-item.test.mjs` failed only because root operating guidance lacked the canonical `Review status` field; all integrated validator cases passed. A second run exposed and then closed exact-label gaps in the review skill and pipeline.
- GREEN: the same focused command passed 10 tests. After repository formatting, `node --test scripts/validate-monorepo-work-item.test.mjs` passed all 61 tests; `node scripts/validate-living-workflow.mjs`, focused ESLint, focused Prettier, and `git diff --check` all exited successfully.
- No validator behavior, digest algorithm, review-batch algorithm, shipped CLI behavior, dependency, package version, or release state changed.

## Review findings and repairs

- Cycle 1 (`review-20260731-integration-01`, `sha256:8b603154c1a556c7e0121e16528eff259403660fdcd320dc608db81d003012fe`): contract passed with no required findings. Quality failed with one acceptance-impacting Medium and one acceptance-related Minor. The new safeguards asserted review semantics only for the pipeline while checking the other live authorities only for field-name presence, so contradictory transition/evidence/failure rules could drift without detection. `NEXT.md` also routed to review while its prose still instructed implementation and described reaching review as the completion point.
- Cycle-1 repair: added per-authority semantic obligations for snapshot definition, pending initialization, complete matching evidence, candidate-changing reset, fail-closed advancement, and applicable immutable-history compatibility to both the focused regression and `scripts/validate-living-workflow.mjs`. Root guidance and the review skill now state the shared calculator/`NEXT.md` exclusion explicitly, the review skill names the complete fail-closed boundary, and `NEXT.md` describes the actual repair/re-review state. The focused semantic test passed, the full validator suite passed 61 tests, and living-workflow validation, focused ESLint, Prettier, and `git diff --check` passed.
- Cycle 2 (`review-20260731-integration-02`, `sha256:b9d5671c6b0c01c756ea9b25a0b894ff15815f1055b12373c955cad24c9e94d3`): both reviewers confirmed the semantic-assertion repair with no Medium-or-higher finding or scope regression. Both failed one acceptance-related Minor because `NEXT.md` still described repair and dispatch as future work after the repair was complete and batch 02 was already active.
- Cycle-2 repair: updated only routing state excluded from the review candidate so `NEXT.md` now describes collecting and reconciling the already-dispatched batch. The candidate snapshot recomputes unchanged; cycle 3 reuses that exact snapshot under a fresh batch identity.
- Cycle 3 (`review-20260731-integration-03`, `sha256:b9d5671c6b0c01c756ea9b25a0b894ff15815f1055b12373c955cad24c9e94d3`): contract and quality both passed with no required findings. Both independently confirmed the routing-only repair, unchanged exact candidate digest, semantic safeguards, acceptance coverage, and absence of scope expansion or regression risk.
- Final verification discovery after cycle 3: `pnpm check` exited 1 because `scripts/validate-living-workflow.test.mjs` did not update its complete routed-workflow fixture for the new semantic authority requirements. The workflow run passed 105 tests, failed that one fixture test, and skipped two Windows privilege-dependent tests. This is an acceptance-related regression in the contracted living-workflow assertion boundary, so verification returned to review for the fourth and final cycle.
- Final-cycle repair: extended only the synthetic complete fixture with the canonical field, snapshot, evidence, reset, fail-closed, and history semantics. The previously failing test passed, living-workflow validation passed, and focused Prettier, ESLint, and `git diff --check` passed.
- Cycle 4 (`review-20260731-integration-04`, `sha256:4e6d6e3148ebc1275a445e0e0a5ad6f568395939d5978fcded7e846128cd1555`): contract and quality both confirmed the fixture repair, exact candidate, full workflow result of 106 passed with two expected skips, semantic safeguards, portability, and static checks. Both failed one acceptance-related Minor because `NEXT.md` still described the already-completed fixture repair, invalidated-check run, and batch-04 dispatch as future work. The failed evidence was received before any routing-only correction and must be preserved. Four review cycles are exhausted, so this routing-state finding is the consolidated blocker and no fifth cycle is permitted under the current contract.
- The user explicitly authorized one additional successor review attempt on 2026-07-31. Successor work item `2026-07-31-complete-review-barrier-integration` owns that single review, verification, and delivery route; this predecessor remains blocked with all four batches unchanged.

## Final verification

Result: failed

- `pnpm check` — exit `1`; formatting, package lint/typecheck/tests, snapshot and batch tests, validator tests, and other workflow tests passed, but `accepts a complete routed-workflow fixture` failed because its synthetic authority files lacked the newly required review-barrier fields and semantics.
