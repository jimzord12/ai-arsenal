# Work Item

Work item: 2026-07-31-complete-review-batch-evidence
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-07-31T14:22:26+03:00
Max time: 5 hours
Last time check: 2026-07-31T14:40:49+03:00
Turns since time check: 0
Review cycles: 2
Review status: passed
Review snapshot: sha256:5bbc3ad2694cc8f60d82fe5db58f3348f5e39b1673bee1bbd46fd7a68b18de65
Review batch: review-20260731-03
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260731-03","snapshot":"sha256:5bbc3ad2694cc8f60d82fe5db58f3348f5e39b1673bee1bbd46fd7a68b18de65"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260731-03","snapshot":"sha256:5bbc3ad2694cc8f60d82fe5db58f3348f5e39b1673bee1bbd46fd7a68b18de65"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Implement GitHub issue #17 by giving Workflow v2 one compact, machine-checkable, runtime-neutral review-batch evidence contract that records batch identity, the exact reviewed snapshot, deterministic required reviewer membership, received completions, and one consolidated disposition, so review passes only after every expected result belongs to the complete matching batch for unchanged candidate bytes.

## Non-goals

- Do not implement validator parsing, stage-advancement blocking, current-snapshot freshness checks, or delivery/delivered enforcement owned by GitHub issue #18.
- Do not add the integrated review-barrier lifecycle matrix or align the normative pipeline and root operating documentation owned by GitHub issue #19 beyond the compact template and review skill surfaces directly required to define issue #17 evidence.
- Do not change the deterministic candidate calculation delivered by issue #16, add workflow stages, change delegation APIs, make correctness depend on synchronous completion, alter Trello behavior, rewrite delivered historical work items, or change shipped CLI package behavior.

## Acceptance criteria

- New compact work items expose exactly one review-batch identifier field, one expected-reviewer field, and one received-results field alongside the existing review status and snapshot fields; their pending defaults cannot represent dispatched or completed review.
- The evidence contract uses deterministic, unique required reviewer roles and records each received result with reviewer identity, completion state, batch identity, and snapshot digest, while `Review status` is the single consolidated pending, failed, or passed disposition.
- A reusable runtime-neutral reconciliation seam accepts the recorded batch, snapshot, expected membership, and any currently available results and produces the same durable evidence and disposition whether all results arrive immediately or across later invocations.
- Dispatch or local test success alone, and missing, partial, cancelled, unknown, unsuccessful, duplicate, unexpected-reviewer, wrong-batch, or wrong-snapshot results, cannot produce `passed`; every expected reviewer must be represented exactly once by a successful completion in the matching batch.
- Any matching required result that is cancelled, unknown, or unsuccessful consolidates the complete batch as `failed`; incomplete batches remain `pending`; only a complete matching all-success batch for the unchanged recorded snapshot becomes `passed`.
- Candidate-changing repair resets review status, snapshot, batch identity, expected membership, and received results to pending before a fresh snapshot and batch are recorded; the old batch cannot be reused.
- Focused tests cover immediately complete and incrementally reconciled paths plus dispatch-only, missing, partial, cancelled, unknown, failed, duplicate, unexpected-reviewer, wrong-batch, wrong-snapshot, local-test-only, repair-reset, and complete matching unchanged-candidate cases.
- Existing Workflow v2 tests remain green, delivered records remain readable without rewriting, and implementation stays limited to issue #17 evidence semantics and the directly affected template/review-skill/test surfaces.

## Implementation summary

- Added `scripts/reconcile-review-batch.mjs`, a dependency-free runtime-neutral reconciliation seam that validates concrete batch/snapshot definitions, canonicalizes expected roles and received results, and produces pending, failed, or passed only from the complete currently available evidence.
- Added `scripts/reconcile-review-batch.test.mjs` with focused coverage for immediately complete and incrementally resumed results, dispatch/local-test-only evidence, missing/partial results, failed/cancelled/unknown outcomes, duplicate and unexpected roles, wrong batch/snapshot bindings, invalid batch definitions, pending template defaults, and full repair reset guidance.
- Updated the compact work-item template with `Review batch`, `Review expected`, and `Review received` pending defaults and concise evidence/reset semantics. Updated `review-monorepo-change` with record-before-dispatch, exact result shape, runtime-neutral reconciliation, and complete-set pass rules; updated `implement-monorepo-change` to reset all five review fields after candidate-changing work.
- Added the focused suite to `pnpm test:workflow`. No validator gating/freshness behavior, integrated normative documentation, shipped CLI behavior, Changeset, version bump, packed artifact, or global installation is included.
- RED: `node --test scripts/reconcile-review-batch.test.mjs` exited `1` with `ERR_MODULE_NOT_FOUND` before the reconciliation seam existed.
- GREEN: the focused suite exited `0` with 7/7 tests passing; focused Prettier and ESLint checks exited `0`. The first workflow-suite run exposed one existing lifecycle-test wording contract after the full-reset guidance was generalized; restoring the literal field names repaired it, and `pnpm test:workflow` then exited `0` with 83 passing tests and two documented Windows privilege-dependent skips.

## Review findings and repairs

- Pre-dispatch inspection found one acceptance-blocking integration defect: the issue-16 snapshot filter did not yet classify the three new batch-evidence fields as mutable review control evidence, so recording a batch would change the candidate digest and immediately stale itself.
- Added the three exact fields to the existing reusable snapshot filter and extended its control-only regression. The new assertion failed before the repair with unequal digests and passed afterward; the focused reconciliation suite and root-script lint remained green.
- The first dispatch batch `review-20260731-01` targeted candidate `sha256:83b0a520718081886765aa7f0043fe2a9e6682f178ab0c9c2bec3b4f56300e63`, but live validation exposed that issue #15's field-level rules rejected a pending review with its required concrete snapshot. Both reviewers were cancelled before results were accepted, and candidate-changing repair reset all five review fields to pending; the cancelled batch cannot be reused.
- Added a focused validator regression proving that pending plus a concrete snapshot is valid only in the review stage, while implement-stage pending-plus-digest remains invalid. This is the minimum schema compatibility needed to represent issue #17's dispatch/incomplete state; it does not parse batch evidence, enforce completion, compare fresh candidate bytes, or change later-stage routing owned by issue #18.
- Fresh batch `review-20260731-02` targets repaired candidate `sha256:5bbc3ad2694cc8f60d82fe5db58f3348f5e39b1673bee1bbd46fd7a68b18de65` with required roles `contract` and `quality`; received evidence is empty before dispatch.
- Cycle 1 completed with the full matching batch and reconciled to `failed`: both independent roles reported one Medium routing finding. `NEXT.md`'s machine-readable pipeline field named review, but its human-readable current phase, next action, requirements, and done condition still described implementation, creating contradictory resume guidance. No other required finding was reported.
- Repaired all stale `NEXT.md` prose to describe the review stage and its complete-batch exit condition. Because `NEXT.md` is routing-only and excluded by the reusable snapshot contract, the candidate remains `sha256:5bbc3ad2694cc8f60d82fe5db58f3348f5e39b1673bee1bbd46fd7a68b18de65`; fresh batch `review-20260731-03` is required to confirm the repair.
- Cycle 2 completed with both required matching results. The reconciliation helper canonicalized reviewer order and returned `passed` with no blockers; both independent reviewers recomputed the exact snapshot, confirmed the prior routing finding was repaired, and reported no remaining Critical, High, Medium, or acceptance-related Minor finding.

## Final verification

Result: passed

- Changed-path inspection: `git status --short` showed exactly the two Workflow v2 stage skills, `NEXT.md`, the compact template, `package.json`, the issue-16 snapshot implementation/test extension, the narrow validator/schema implementation/test extension, this compact work item, and the new reconciliation implementation/test. Every path is attributable to issue #17; no shipped CLI package, delivered historical record, or issue #18/#19 enforcement/documentation surface changed.
- Full repository gate: `pnpm check` — exit `0`; Prettier, four-package lint/typecheck/test tasks, 86 workflow tests, and both current workflow validators passed. Workflow tests reported 84 passed and two documented Windows privilege-dependent skips.
- Root script lint: `pnpm lint:root` — exit `0`; ESLint accepted all root scripts, including both new reconciliation files and the narrow snapshot/validator extensions.
- Snapshot freshness: `node scripts/calculate-review-snapshot.mjs --repository-root . --work-item docs/work-items/2026-07-31-complete-review-batch-evidence/work-item.md` — exit `0`; output exactly matched reviewed snapshot `sha256:5bbc3ad2694cc8f60d82fe5db58f3348f5e39b1673bee1bbd46fd7a68b18de65` after every verification command.
- Selected-item validator: `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-31-complete-review-batch-evidence --json` — exit `0`; the verify-stage item was valid with review status passed and review batch `review-20260731-03` represented in the compact record.
- Living-workflow validator: `node scripts/validate-living-workflow.mjs` — exit `0`; required files and active `NEXT.md` structure passed.
- Whitespace gate: `git diff --check` — exit `0` with no output.
- Manual evidence inspection confirmed one result per required role, exact matching batch/snapshot bindings, a consolidated passed disposition with no blockers, equivalent immediate/resumed reconciliation, full repair invalidation evidence, and explicit issue #18/#19 exclusions.

## Delivery evidence

- Proportionality check at `2026-07-31T14:40:49+03:00`: elapsed work is approximately 19 minutes against the 5-hour maximum. Scope remains the smallest honest issue-#17 boundary despite two review-discovered integration repairs; no simplification or escalation is needed.
- Delivery is in progress; artifact commit, push, exact-SHA CI, issue closure, and completed-state evidence are pending.
