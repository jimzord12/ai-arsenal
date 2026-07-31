# Work Item

Work item: 2026-07-31-deterministic-review-snapshot
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-07-31T13:46:08+03:00
Max time: 5 hours
Last time check: 2026-07-31T13:46:08+03:00
Turns since time check: 1
Review cycles: 2
Review status: passed
Review snapshot: sha256:e6155d95ce5e6de12e014887bc1c80346d1a43331ff55083ccf6176ca6202cfd
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Implement GitHub issue #16 by adding one reusable deterministic SHA-256 function that computes the exact Workflow v2 review-candidate snapshot from repository state, together with an adjacent inclusion/exclusion contract and focused digest tests, so later review and validator work can consume the same calculation.

## Non-goals

- Do not implement required review-batch identity, membership, dispatch, completion, or reconciliation semantics owned by GitHub issue #17.
- Do not compare a recorded snapshot with a freshly computed digest, block stage advancement, change validator routing, or enforce verification/delivery freshness; those behaviors belong to GitHub issue #18.
- Do not add the integrated review-barrier regression matrix or align the normative Workflow v2 documentation surfaces owned by GitHub issue #19.
- Do not add workflow stages, alter Trello behavior, redesign CI/release/delivery, rewrite delivered historical work items, or change any shipped CLI package behavior.

## Acceptance criteria

- A repository-owned Node module exposes one callable review-snapshot function for later reuse by both review and validation, accepts an explicit repository root and active work-item path, and returns exactly `sha256:<64 lowercase hexadecimal characters>` without emitting candidate bytes or secret-bearing diagnostics.
- The documented candidate boundary includes every tracked change relative to `HEAD` plus every non-ignored untracked file, including relevant source, tests, package metadata, skills, and documentation; ignored files and repository control-only `NEXT.md` routing content are excluded.
- Each included path is represented from the current working-tree candidate with normalized repository-relative `/` paths, deterministic ordinal ordering, explicit length-delimited entry framing, a present/deleted state, Git file-mode/type identity, and raw file or symbolic-link bytes. Git rename detection is disabled so renames are deterministically represented as deletion plus addition, and deletions do not require reading absent content.
- The active `work-item.md` remains an included candidate path, but its snapshot representation excludes only mutable top-level stage/status/timing/review-routing fields and the review, verification, and delivery evidence sections. Work-item identity, safety/approval classification, goal, non-goals, acceptance criteria, implementation description, and any otherwise-unrecognized content remain included by default.
- Identical candidate state produces the same digest on supported Windows and Linux environments. Changing included content, adding or deleting a path, renaming a path, changing its file type/mode, changing reviewed work-item intent, or changing entry boundaries changes the digest; candidate discovery order and permitted control-only updates do not.
- Focused isolated temporary-Git-repository tests cover unchanged state, content changes, non-ignored additions, deletions, rename-as-delete-plus-add behavior, file-type/mode changes where supported, ordering, normalized paths, collision-safe framing, ignored additions, reviewed work-item intent changes, and permitted control-only work-item/NEXT updates.
- The focused suite is included in the repository workflow test gate, the existing workflow tests remain green, and implementation documentation identifies the reusable API and exact inclusion/exclusion rules without adding the later issues' orchestration or enforcement behavior.

## Implementation summary

- Added `scripts/calculate-review-snapshot.mjs`, which exports `calculateReviewSnapshot({ repositoryRoot, workItemPath })` and exposes the same calculation through an explicit two-argument command interface. The adjacent module contract defines Git-based candidate discovery, the narrow `NEXT.md` and active-work-item control exclusions, ordinal normalized paths, length-delimited framing, raw baseline/current byte handling, file modes/types, deletion entries, and rename-as-delete-plus-add behavior.
- Added `scripts/calculate-review-snapshot.test.mjs` with isolated temporary Git repositories covering stable/output-only digests, the command interface, content changes, ignored and non-ignored additions, staging invariance, deletions and their baseline bytes, renames, executable-mode changes, a Unix-only symlink type change, discovery order, path spelling normalization, collision-safe framing, work-item intent and implementation changes, permitted work-item control/evidence changes, and `NEXT.md` routing changes.
- Updated `package.json` so the focused snapshot suite participates in `pnpm test:workflow`. Updated `NEXT.md` and this compact record only for Workflow v2 definition and routing evidence; no shipped CLI package, Changeset, release, or global installation applies.
- RED: `node --test scripts/calculate-review-snapshot.test.mjs` exited `1` with `ERR_MODULE_NOT_FOUND` before the reusable module existed.
- GREEN after implementation and formatting: `node --test scripts/calculate-review-snapshot.test.mjs` exited `0`; 15 tests passed and the Unix-only symbolic-link type test was skipped on Windows, while executable-mode identity coverage passed locally. The real repository command returned exactly one correctly shaped digest without candidate content.
- Focused implementation checks passed: changed-path Prettier and ESLint exited `0`; `pnpm test:workflow` exited `0` with 76 passing tests and two documented Windows privilege-dependent skips; the selected-item validator, living-workflow validator, and `git diff --check` exited `0`.

## Review findings and repairs

- Cycle 1 reviewed candidate `sha256:c50f5f8c45150848c4d092d8b4c846973a6c7d6a3748a24ba0a708a1d5717661` and found one acceptance-related finding: deletion entries framed the deleted path and baseline mode but omitted the baseline Git object identity. Deleting the same path and mode from two different baseline contents could therefore produce the same candidate digest even though the reviewed deletion differed.
- Repair added a focused regression proving that different baseline bytes for the same deleted path must produce different digests; it failed against the reviewed implementation because both digests were `sha256:140b0109df43ea787358016deec9e985287693c0682e1a91b1b488c843521816`. The implementation now frames raw baseline object bytes for every tracked candidate entry and filters active-work-item baseline bytes through the same narrow control exclusions. The targeted regression then passed.
- A staging-invariance regression was added while refining baseline representation: staging unchanged added and modified candidate bytes leaves the digest unchanged. Fresh focused and workflow suites, changed-path formatting/lint, and whitespace checks passed after the repair.
- Cycle 2 reviewed the repaired full candidate, including Git-state discovery, raw baseline/current bytes, deletions, rename behavior, modes/types, work-item filtering, routing exclusion, path ordering/normalization, framing, CLI output, focused tests, and issue `#17`–`#19` boundaries. No Critical, High, Medium, or acceptance-related Minor finding remains. The complete reviewed candidate is `sha256:e6155d95ce5e6de12e014887bc1c80346d1a43331ff55083ccf6176ca6202cfd`.

## Final verification

Result: passed

- Changed-path inspection: `git status --short` showed only `NEXT.md`, `package.json`, this new compact work-item directory, and the new snapshot implementation/test files. Every path is attributable to issue `#16`; no delivered historical work item, shipped CLI package, or issue `#17`–`#19` surface changed.
- Snapshot freshness: `node scripts/calculate-review-snapshot.mjs --repository-root . --work-item docs/work-items/2026-07-31-deterministic-review-snapshot/work-item.md` — exit `0`; output was exactly `sha256:e6155d95ce5e6de12e014887bc1c80346d1a43331ff55083ccf6176ca6202cfd`, matching the recorded reviewed snapshot after all verification commands.
- Full repository gate: `pnpm check` — exit `0`; repository Prettier, all four package lint/typecheck/test tasks, the 78-test workflow suite, and both current workflow validators passed. Workflow tests reported 76 passed and two documented Windows privilege-dependent skips; the issue-#16 suite contributed 15 passes and one Windows-skipped Unix symbolic-link type case, with Windows executable-mode coverage passing.
- Root script lint: `pnpm lint:root` — exit `0`; ESLint accepted the complete repository including the new root scripts.
- Selected-item validator: `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-31-deterministic-review-snapshot --json` — exit `0`; the reviewed verify-stage item was valid with `Review status: passed` and the matching concrete snapshot.
- Living-workflow validator: `node scripts/validate-living-workflow.mjs` — exit `0`; required workflow files and `NEXT.md` structure passed.
- Whitespace gate: `git diff --check` — exit `0` with no output.
- Manual acceptance inspection confirmed the single exported/API-and-command calculation includes tracked changes and non-ignored additions, raw baseline/current bytes, explicit deletions, rename-as-delete-plus-add behavior, modes/types, normalized ordinal paths, collision-safe length framing, and narrowly filtered active-work-item intent while excluding only `NEXT.md` routing and named mutable work-item control/evidence. Output contains only the prefixed digest, and review-batch orchestration, stale-snapshot gating, integrated regressions/normative documentation, package release, and historical-record rewriting remain excluded.

## Delivery evidence

- Verified artifact-bearing commit `6d0e7eac900ff3c418ecfdd2071ad989dcd28318` was committed as `feat(workflow): add deterministic review snapshots` and pushed to `origin/master`; a fresh fetch confirmed local `HEAD` and `origin/master` were equal, and the worktree was clean before closure-record edits.
- Exact-commit Quality run `https://github.com/jimzord12/ai-arsenal/actions/runs/30625803324` completed successfully for head SHA `6d0e7eac900ff3c418ecfdd2071ad989dcd28318`, including repository checks and private artifact validation.
- Exact-commit Portability run `https://github.com/jimzord12/ai-arsenal/actions/runs/30625803323` completed successfully for the same head SHA; both Ubuntu and Windows process/distribution jobs passed, so the focused snapshot suite ran on both supported platforms and the Unix symbolic-link type case ran in CI.
- GitHub issue `#16` was read back as `CLOSED` with reason `COMPLETED`. The connected GitHub app lacked close permission (`403 Resource not accessible by integration`), so the authenticated `gh issue close` fallback performed the bounded mutation and `gh issue view` verified it.
- This is workflow-policy behavior, not shipped CLI behavior; no Changeset, package version, packed artifact replacement, registry publication, or global installation applies.
- Canonical planning truth records the reusable deterministic snapshot boundary. Review-batch evidence issue `#17` is the next bounded child; snapshot gating and integrated barrier alignment remain owned by issues `#18` and `#19`.
