# Work Item

Work item: 2026-07-31-enforce-review-barrier-validation
Workflow: 2
Stage: review
Status: blocked
Started at: 2026-07-31T18:26:16+03:00
Max time: 5 hours
Last time check: 2026-07-31T18:26:16+03:00
Turns since time check: 2
Review cycles: 4
Review status: failed
Review snapshot: sha256:6d241f438d0e29f9489c427b7ea2633a7a28c17efbe7a032fce1f9d2230c0db5
Review batch: review-20260731-04
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"failed","batchId":"review-20260731-04","snapshot":"sha256:6d241f438d0e29f9489c427b7ea2633a7a28c17efbe7a032fce1f9d2230c0db5"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260731-04","snapshot":"sha256:6d241f438d0e29f9489c427b7ea2633a7a28c17efbe7a032fce1f9d2230c0db5"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Implement GitHub issue #18 by making the Workflow v2 validator parse and enforce the complete issue-#17 review-batch contract, block advancement from review and reject verify, deliver, or newly delivered state when review evidence is pending, failed, malformed, incomplete, mismatched, or stale, and return actionable read-only blockers without changing the shared digest or reconciliation algorithms.

## Non-goals

- Do not change review dispatch, reviewer delegation, the deterministic snapshot algorithm, or review-batch reconciliation semantics delivered by issues #16 and #17.
- Do not add issue #19's integrated end-to-end lifecycle matrix or align the normative Workflow v2, root guidance, template, or stage-skill documentation except for a minimal directly required validator compatibility correction discovered during implementation.
- Do not rewrite delivered historical work items, add workflow stages, alter Trello behavior, change shipped CLI package behavior, create a Changeset, publish or globally install a package, or redesign Git/CI delivery.

## Acceptance criteria

- The validator parses `Review batch`, `Review expected`, and `Review received` exactly once for current explicit-lifecycle records, rejects malformed JSON or invalid field shapes, and uses `reconcileReviewBatch` as the single semantic authority for batch membership, result binding, completion, and disposition.
- Review-stage pending or failed evidence remains routed to `review-monorepo-change`; only `Review status: passed` with one complete matching all-passed batch bound to the recorded concrete snapshot may validate at verify entry.
- Verify and deliver reject pending, failed, missing-digest, incomplete, duplicate, unexpected-reviewer, wrong-batch, wrong-snapshot, malformed, or status/evidence-inconsistent review records with a blocker that names the failed precondition and concrete remediation.
- For active verify and deliver items, the validator recomputes the current candidate through `calculateReviewSnapshot` and rejects any recorded digest that does not equal the fresh digest, independently of edited stage or status fields.
- Delivery preserves freshness coherently across the existing artifact and closure commits: active delivery must pass the fresh-snapshot check before delivery mutations; a newly delivered explicit-lifecycle record must retain valid complete matching passed evidence and have no uncommitted candidate changes, while historical delivered records remain readable under their existing compatibility path.
- Focused validator tests cover parsing, expected/received set consistency, batch and snapshot binding, pending and failed review, incomplete and malformed evidence, stale verify/deliver/delivered bypass attempts, actionable blockers, an unchanged valid candidate, read-only behavior, and delivered-history compatibility without absorbing issue #19's full integrated lifecycle matrix.
- Existing Workflow v2 tests remain green, validator execution leaves repository and work-item bytes unchanged, and all changes stay within issue #18's validator-only boundary.

## Implementation summary

- Extended `scripts/validate-monorepo-work-item.mjs` to parse the three issue-#17 batch fields exactly once, preserve the no-batch compatibility path only for delivered historical records, and delegate batch membership, binding, completion, and disposition to `reconcileReviewBatch`.
- Added fail-closed review-stage blockers and verify/deliver rejection for undispatched, pending, failed, malformed, incomplete, duplicate, unexpected, wrong-batch, wrong-snapshot, or status-inconsistent evidence. Active verify/deliver recompute the candidate through `calculateReviewSnapshot`; newly delivered records require complete evidence and a clean candidate state.
- Extended `scripts/validate-monorepo-work-item.test.mjs` with focused fixtures for evidence parsing and shapes, review retention, actionable blocker text, batch/snapshot mismatch cases, stale verify/deliver candidates, delivered bypass attempts, mutation-free validation, and delivered-history compatibility. The existing fixture generator now emits canonical issue-#17 evidence for explicit current records.
- RED: `node --test scripts/validate-monorepo-work-item.test.mjs` exited `1` with five new enforcement groups failing before validator implementation.
- GREEN: the initial focused suite exited `0` with 46/46 tests passing. After cycle-1 repairs, it exited `0` with 49/49 tests passing; focused Prettier and ESLint also exited `0`.
- Exact-SHA CI repair: extended `calculateReviewSnapshot` with optional paired `baselineRef`/`candidateRef` inputs that read both Git trees without checkout and feed the unchanged path framing, mode, byte filtering, and SHA-256 algorithm. Active delivery uses `HEAD^`→`HEAD` only when the ordinary current-candidate digest mismatches and the candidate is otherwise clean.
- Added a shared-seam equality regression proving a committed parent→child candidate reproduces its pre-commit working snapshot, and extended active-deliver coverage to validate the clean reviewed artifact commit before confirming a later dirty change is still stale. RED: the new equality assertion failed and the clean artifact could not validate before implementation. GREEN: `node --test scripts/calculate-review-snapshot.test.mjs scripts/validate-monorepo-work-item.test.mjs` exited `0` with 65 passed and one existing platform-dependent skip; focused ESLint passed.

## Review findings and repairs

- Cycle 1, batch `review-20260731-01`, snapshot `sha256:24281336386dabec098103e2bf33c76cda3ea702457bbe4e97af8dadae16f001`: both required reviewers returned matching failed results.
- High: treating every delivered record without batch fields as historical lets a current record remove those fields and bypass evidence, freshness, and dirty-candidate enforcement. Repair must bind compatibility to genuinely pre-issue-#17 records and add a field-removal bypass regression.
- Medium: treating absence of `.git` as “not a Git repository” skips freshness for current verify/deliver records. Repair must fail closed with an actionable Git-context blocker and update fixtures to exercise real snapshot validation.
- Repaired the High finding by proving delivered historical compatibility from the tracked `HEAD` version of the same work item: only a baseline already recorded as delivered without batch fields uses the compatibility path. A current item that removes batch fields now fails, including after stage/status edits and active-registration clearing.
- Repaired the Medium finding by requiring readable Git metadata for every current explicit-lifecycle freshness check. Missing or unreadable repository context now returns an actionable blocker; valid verify/deliver fixtures create isolated Git repositories and record their actual shared snapshot.
- Added focused regressions for missing Git metadata, batch-field removal masquerading as history, tracked pre-batch delivered compatibility, and mutation-free fresh-snapshot validation. The repaired focused suite passes 49/49 with focused lint green.
- Cycle 2, batch `review-20260731-02`, snapshot `sha256:958d3e9d59b3418cbe28134bb110506353b6eef8bf484a69652a05f98ee84de2`: both matching required reviewers confirmed the Git fail-closed repair but returned failed because current-`HEAD` provenance can still be forged by committing the bypass state before validation.
- Remaining High: compatibility must recognize immutable pre-issue-#17 historical bytes, not merely a currently committed delivered record without batch fields, and the regression must cover a committed bypass.
- Repaired the remaining High by replacing mutable `HEAD` inference with an exact SHA-256 allowlist of the eleven delivered pre-review-batch work-item byte sequences already in repository history. Both the older `Required findings remaining` schema and the issue-#15/#16 explicit lifecycle without batch fields are readable only when their current bytes match that immutable compatibility boundary.
- Extended the bypass regression to commit the forged delivered/no-batch state before validation; it remains rejected. Added representative exact-byte compatibility checks for both a legacy record and an explicit-lifecycle pre-batch record. The focused suite remains 49/49 green with ESLint, Prettier, and `git diff --check` passing.
- Cycle 3, batch `review-20260731-03`, snapshot `sha256:68bb115d64f84eba7ab76e2a0d6b8a583a415d5c7c9f91684681f48057d8dd6d`: both required reviewers returned matching passed results. They independently recomputed the exact snapshot, confirmed all eleven immutable compatibility hashes, exercised the committed bypass and missing-Git failures, and reported no remaining Critical, High, Medium, or acceptance-related Minor findings.
- Artifact commit `a9b2be73e6f21fcae3541bb50eeb86f341ee9ecf` exposed one delivery-timing defect in exact-SHA Quality run `30644565179`: a clean checkout at active delivery has no working-tree diff, so recomputing only against current `HEAD` incorrectly marked the reviewed parent-to-commit candidate stale. Portability run `30644565335` was still in progress when the deterministic Quality failure was diagnosed.
- Repair scope for the final cycle: extend the shared snapshot seam with a checkout-free parent-to-commit source mode that preserves the existing framing/filter/digest algorithm, use it only as the active-deliver fallback for a clean candidate, and add equality plus clean-artifact routing regressions. This resolves established delivery timing without weakening dirty-candidate freshness or duplicating digest mechanics.
- Cycle 4, batch `review-20260731-04`, snapshot `sha256:6d241f438d0e29f9489c427b7ea2633a7a28c17efbe7a032fce1f9d2230c0db5`: quality passed; contract failed with one Medium required finding. Commit-mode snapshotting hard-codes `submoduleState: N...`, while the working-tree source frames Git's `S<c><m><u>` state for gitlinks, so an exact reviewed gitlink update can mismatch after commit. Focused coverage currently proves regular-file equivalence only.
- The four-cycle review limit is exhausted. The item is blocked with the concrete failed batch preserved; no fifth repair, verification, delivery, planning reconciliation, or issue closure is permitted without a new user-directed work-item decision.
- On 2026-07-31 the user explicitly directed creation of successor work item `2026-07-31-fix-gitlink-snapshot-equivalence`. This record remains blocked with its exact failed batch; the successor owns the gitlink-only repair and issue-#18 completion route.

## Final verification

Result: pending

- Changed-path inspection found exactly `NEXT.md`, the active compact work item, `scripts/validate-monorepo-work-item.mjs`, and its focused test. All are attributable to issue #18; no shipped CLI, package metadata, Changeset, normative issue-#19 documentation, or delivered historical work-item bytes changed.
- Full repository gate: `pnpm check` — exit `0`; formatting, four-package lint/typecheck/test tasks, 94 workflow tests, and both workflow validators passed. Workflow tests reported 92 passed and two documented Windows privilege-dependent skips.
- Root script lint: `pnpm lint:root` — exit `0`; ESLint accepted the validator, focused tests, and all root scripts.
- Selected-item validator: `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-31-enforce-review-barrier-validation --json` — exit `0`; the verify-stage item was valid and routed only to verification before this evidence was recorded.
- Living-workflow validator: `node scripts/validate-living-workflow.mjs` — exit `0`; required files and active registration passed.
- Snapshot freshness: `node scripts/calculate-review-snapshot.mjs --repository-root . --work-item docs/work-items/2026-07-31-enforce-review-barrier-validation/work-item.md` — exit `0`; output remained exactly `sha256:68bb115d64f84eba7ab76e2a0d6b8a583a415d5c7c9f91684681f48057d8dd6d` after every verification command.
- Whitespace gate: `git diff --check` — exit `0` with no output.
- Manual evidence inspection confirmed one matching passed result per required role, immutable exact-byte compatibility for all eleven pre-batch delivered records, rejection of committed no-batch and fabricated-legacy bypasses, actionable missing-Git and stale-snapshot blockers, and mutation-free validation.

## Delivery evidence

- Artifact attempt `a9b2be73e6f21fcae3541bb50eeb86f341ee9ecf` was pushed to `origin/master`. Exact-SHA Quality run `https://github.com/jimzord12/ai-arsenal/actions/runs/30644565179` failed only because the active-deliver validator could not yet reconstruct the reviewed parent-to-commit candidate in CI's clean checkout; the failure is preserved as repair evidence and the item returned to review.
