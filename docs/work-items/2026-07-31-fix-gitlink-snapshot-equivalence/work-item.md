# Work Item

Work item: 2026-07-31-fix-gitlink-snapshot-equivalence
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-07-31T19:16:04+03:00
Max time: 3 hours
Last time check: 2026-07-31T19:16:04+03:00
Turns since time check: 1
Review cycles: 4
Review status: passed
Review snapshot: sha256:41e38f2c5a9d1fe2e54358c3f7fad341a98f57e9ecb413ecf2fbb3e4dda2cc48
Review batch: review-20260731-gitlink-04
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260731-gitlink-04","snapshot":"sha256:41e38f2c5a9d1fe2e54358c3f7fad341a98f57e9ecb413ecf2fbb3e4dda2cc48"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260731-gitlink-04","snapshot":"sha256:41e38f2c5a9d1fe2e54358c3f7fad341a98f57e9ecb413ecf2fbb3e4dda2cc48"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Complete the remaining GitHub issue #18 delivery repair by making the shared parent-to-commit review snapshot reproduce working-tree snapshot semantics for Git gitlink/submodule updates and deletions, so an exact reviewed artifact validates in a clean CI checkout without weakening dirty-candidate enforcement.

## Non-goals

- Do not reopen or erase the predecessor's four-cycle review history; it remains a blocked audit record superseded operationally by this user-authorized successor.
- Do not redesign the snapshot framing, filtering, or SHA-256 algorithm; change only commit-source derivation needed to reproduce existing working-tree gitlink semantics.
- Do not expand issue #18's validator behavior beyond the already reviewed implementation and this gitlink equivalence repair, and do not absorb issue #19's integrated lifecycle matrix or normative documentation alignment.
- Do not alter submodule contents, publish packages, create a Changeset, change shipped CLI behavior, or perform destructive Git operations.

## Acceptance criteria

- Focused disposable-repository tests observe Git's real porcelain-v2 submodule state and prove pre-commit working and parent-to-commit snapshots are byte-identical for a gitlink commit-pointer update.
- Focused coverage proves gitlink deletion produces equivalent working and parent-to-commit snapshots, and covers addition when Git exposes a distinct state requiring derivation.
- Commit-source snapshotting derives the same framed submodule-state value as the existing working-tree source for commit-representable gitlink changes; it does not guess or erase dirty tracked/untracked submodule state that cannot exist in the committed artifact.
- Active delivery accepts a clean exact reviewed artifact commit through the shared commit-candidate seam, while any later tracked or untracked candidate change remains stale and blocked.
- The combined snapshot and validator focused suites pass on Windows and Linux-compatible Git plumbing, validation remains read-only, and no duplicate digest algorithm is introduced.
- After independent review and final verification pass, the successor records the prior failed Quality run, produces a new CI-green artifact commit, reconciles issue #18 as complete, closes it, and leaves issue #19 as the sole next child.

## Implementation summary

- Adopted the predecessor's reviewed clean-checkout repair: `calculateReviewSnapshot` accepts paired `baselineRef`/`candidateRef` inputs, reads changed paths directly from both Git trees without checkout, and feeds the existing framing/filter/hash algorithm; active delivery uses `HEAD^`→`HEAD` only after the ordinary current-candidate digest mismatches and the candidate is clean.
- Added a real local-submodule fixture to `scripts/calculate-review-snapshot.test.mjs`. It observes porcelain-v2 state and proves exact working-versus-commit digest equality for staged gitlink addition, staged commit-pointer update, and deletion. It also proves an untracked dirty submodule (`S..U`) does not equal the committed artifact.
- Derived commit-mode submodule state as `S...` whenever either tree side is mode `160000`, matching Git's observed clean staged addition/update/deletion state; ordinary entries remain `N...`. Working-tree baseline gitlink IDs are framed directly as ASCII commit IDs rather than passed to `git cat-file` in the superproject, where the submodule commit object is not stored.
- RED: the new real gitlink equality test first failed on addition because commit mode used `N...`; after that repair it exposed the pre-existing superproject `cat-file` failure for a baseline gitlink, then observed deletion as `S...`. These failures directly drove the final three-line semantic repair.
- GREEN after cycle-1 repair: `node --test scripts/calculate-review-snapshot.test.mjs scripts/validate-monorepo-work-item.test.mjs` exited `0` with 67 passed and one existing Windows privilege-dependent skip. Focused ESLint, Prettier, and `git diff --check` exited `0`.

## Review findings and repairs

- Cycle 1 (`review-20260731-gitlink-01`, `sha256:bdb0ef2c8f49e034e0d8b65e21f4738d91b1cab725237b6d6d600196ea63b367`): contract passed; quality failed with one High finding. Both working-candidate discovery and the active-delivery cleanliness gate allowed `submodule.<name>.ignore=all` to suppress real tracked or untracked submodule dirt, so the clean commit fallback could conceal an `S..U` state.
- Repair: force `--ignore-submodules=none` in both Git status invocations. Regression coverage configures `ignore=all`, proves ordinary status is empty while the snapshot still observes `S..U`, and proves active delivery rejects the dirty artifact instead of accepting the clean commit fallback.
- Cycle 2 (`review-20260731-gitlink-02`, `sha256:02b60cab28416a8939c3c0b241d631ebd3e01c7291ce8225950bd1172e280e06`): contract passed; quality failed with one Medium finding. Commit-source `git diff --name-only` still honored `submodule.*.ignore=all` or `diff.ignoreSubmodules=all`, so a legitimate committed gitlink change could be omitted and fail exact equivalence.
- Repair: force `--ignore-submodules=none` on commit-tree diff discovery too. The real gitlink fixture now proves ordinary configured diff omits the addition while explicit discovery sees it and retains the same reviewed digest.
- Cycle 3 (`review-20260731-gitlink-03`, `sha256:a2a6af33aac6cc70c389c4d9721fc4e7c442aced60107494e081782cf3ace128`): contract and quality both passed on the unchanged candidate with no required findings. Both reviewers independently recomputed the exact snapshot; 67 tests passed with one existing Windows privilege-dependent skip, and focused static checks passed.
- Delivery CI exposed a shallow-checkout prerequisite after cycle 3: Quality run `30647997996` failed because the clean-delivery fallback correctly requested `HEAD^`, but the default one-commit `actions/checkout` clone did not contain it. Portability run `30647998169` passed on both Windows and Ubuntu. The repair sets Quality checkout `fetch-depth: 2` and locks that prerequisite with a root test before the fourth and final review cycle.
- Cycle 4 (`review-20260731-gitlink-04`, `sha256:41e38f2c5a9d1fe2e54358c3f7fad341a98f57e9ecb413ecf2fbb3e4dda2cc48`): contract and quality both passed with no required findings. Both reviewers independently matched the exact snapshot, confirmed two-commit Quality checkout is sufficient for `HEAD^`, and confirmed the earlier gitlink and dirty-state protections remain intact; 68 tests passed with one existing privilege-dependent skip.

## Final verification

Result: passed

- Cycle-3 verification passed on `sha256:a2a6af33aac6cc70c389c4d9721fc4e7c442aced60107494e081782cf3ace128`, but delivery CI invalidated that candidate by discovering the shallow-checkout prerequisite.
- Final cycle-4 snapshot `sha256:41e38f2c5a9d1fe2e54358c3f7fad341a98f57e9ecb413ecf2fbb3e4dda2cc48` passed `pnpm check`, `pnpm lint:root`, living-workflow validation, selected work-item validation, exact snapshot recomputation, and `git diff --check`.
- The full workflow suite passed 96 tests with two existing Windows privilege-dependent skips; the focused snapshot/validator suite passed 68 tests with one existing skip.

## Delivery evidence

- Artifact commit `7d3daa365821082f237c41a0df6312660cb653ef` was pushed. Portability run `30647998169` passed; Quality run `30647997996` failed only at clean-delivery validation because its one-commit checkout lacked `HEAD^`.
- Replacement artifact commit `8b2824e702c84462bc522ab5e9ccf489056d940d` equals `origin/master` and passed exact-SHA Quality run `30648643513` plus Portability run `30648643584` on Ubuntu and Windows.
- GitHub issue `#18` is closed as completed. The canonical plan records the delivered validator, gitlink, dirty-state, historical-compatibility, and CI checkout invariants; issue `#19` remains the final child.
- Active registration is cleared in `NEXT.md`. The delivered-record and living-workflow validators must pass on the clean closure commit.
