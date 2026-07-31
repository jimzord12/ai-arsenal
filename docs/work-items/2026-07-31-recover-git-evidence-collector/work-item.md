# Work Item

Work item: 2026-07-31-recover-git-evidence-collector
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-07-31T10:56:22+03:00
Max time: 8 hours
Last time check: 2026-07-31T12:04:15+03:00
Turns since time check: 0
Review cycles: 4
Required findings remaining: no
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Recover WU-30 truthfully after premature repository closure, repair the independently identified privacy and Git-evidence integrity defects, and deliver a reviewed, exact-CI-green patch release that safely replaces the installed `0.1.0` artifact before WU-30 is completed in Trello.

## Non-goals

- Do not start WU-31 or add Vercel, Hermes, Telegram, scheduling, report-writing, or consumer-specific behavior.
- Do not rewrite the original WU-30 delivery record as though its late independent reviews had passed; preserve that record as historical evidence and link this corrective item to it.
- Do not publish to a registry, access consumer repositories, collect private repository history, expose credentials, or include consumer identifiers in public source, tests, diagnostics, documentation, or evidence.
- Do not modify the unrelated Trello member-filtering work currently present in the primary worktree.
- Do not add speculative abstractions or broaden the package beyond the existing process-only Git evidence collector.

## Acceptance criteria

- The correction is delivered through this separate Workflow v2 item and one coherent recovery PR linked to original work item `2026-07-31-add-git-evidence-collector` and Trello WU-30; historical premature-delivery evidence remains readable and current planning truth explicitly distinguishes defective `0.1.0` from the repaired release.
- `--remote` accepts only a conservative safe remote-name grammar. URI-shaped, control-character, newline, and otherwise unsafe values fail as generic stderr-only usage errors with exit `2`, and real-process tests prove supplied credentials and full URLs appear in neither stdout nor stderr.
- Runtime evidence validation consistently requires full 40- or 64-hex Git object IDs and strict ISO instants for commit and interval timestamps. CLI-boundary tests prove malformed collector evidence becomes `GIT_OUTPUT_VALIDATION_FAILED`, versioned unverifiable stdout, generic stderr, and exit `1`.
- Argument validation strictly rejects impossible calendar/clock instants, including invalid leap days, month lengths, hours, minutes, seconds, and timezone offsets, while accepting valid leap-year and offset boundaries. Invalid instants remain stderr-only usage errors with exit `2`.
- Before fetch, collection rejects a selected remote whose name has a slash-prefix namespace relationship with another configured remote. Synthetic process evidence proves rejection occurs before fetch and before tracking-ref mutation.
- Fetch always passes `--no-recurse-submodules`; a repository fixture with recursive submodule fetching configured proves no submodule remote is contacted or mutated.
- Existing repairs remain intact: unrelated histories identify the affected branch explicitly, fetch does not write `.git/FETCH_HEAD`, fetch failures remain generic, merge bases remain plural, and distribution tests enforce the exact eight-file tarball boundary.
- Every behavior repair follows focused RED→GREEN tests. Final stable bytes pass package format/lint/typecheck/build/tests/distribution/strict publint, applicable root gates, workflow validators, `git diff --check`, privacy inspection, and fresh independent reviews with no unresolved required finding; final test totals are reconciled everywhere they are stated.
- Changesets generates an appropriate patch version and changelog. The exact reviewed artifact-bearing commit passes required Quality and Windows/Linux Portability CI before packing.
- The exact CI-green tarball is inventoried and checksummed, installed into a clean consumer and independently smoked, then replaces global `0.1.0` only after preflight and artifact success. Installed version/files and generated-shim version/help plus disposable synthetic collection are independently verified, with rollback evidence recorded.
- Only after merge, exact-artifact installation, immutable repository evidence, default-branch/remote equality, and clean recovery worktree are verified may Trello WU-30 move through guarded In Progress → Review → Done with fresh reads, dry-runs, latest versions, stable operation IDs, execution, and read-backs.

## Implementation summary

- Corrective route: preserved `2026-07-31-add-git-evidence-collector` as the historical premature delivery record and created this separate item linked to WU-30. Recovery runs in `ai-arsenal.worktrees/wu30-recovery` so the unrelated primary-worktree Trello filtering changes remain untouched.
- Changed paths: `NEXT.md`, the canonical plan, the original WU-30 record, this work item, and `packages/weekly-report-cli/{README.md,CHANGELOG.md,package.json,src/{arguments,evidence-schema,git-collector}.{ts,test.ts},src/{cli.ts,cli.test.ts},test/process.e2e.test.ts}`.
- Added conservative remote/default-branch parsing and value-agnostic rejected-input diagnostics; strict calendar/clock/offset validation; full SHA-1/SHA-256 object-ID and strict instant runtime validation; pre-fetch remote namespace conflict rejection; and `--no-recurse-submodules` on fetch.
- Preserved prior repairs for explicit unrelated-history evidence, generic fetch diagnostics, plural merge bases, no `FETCH_HEAD` write, and exact eight-file distribution inventory.
- RED evidence: focused argument/process tests failed for seven unsafe remote forms and impossible instants; schema/CLI tests accepted malformed object IDs and timestamps; the namespace fixture fetched and mutated instead of rejecting; and recursive-submodule configuration caused `GIT_FETCH_FAILED` by contacting the submodule remote.
- GREEN evidence: the same focused seams passed after each smallest repair. Package formatting, lint, strict typecheck, build, all seven suites with 79 tests, coverage thresholds, and the existing clean packed-consumer distribution test passed.
- Changesets generated patch release `0.1.1` and its changelog; registry publication and global replacement have not occurred.

## Review findings and repairs

- Cycle 1 reviewed staged diff `74f48a6643ba4b0b9250ea455427ba33e8af0cb4afa85fd03981e9c14ed1961e` with three independent agents. Required findings were: unsafe `..`/`.lock` ref names; credential-bearing values echoed through invalid instants, default branches, unknown commands, and unknown options; and canonical planning truth still treating defective `0.1.0` as complete.
- Repaired ref-path validation, added conservative default-branch validation, made rejected-input diagnostics value-agnostic, and added real-process non-disclosure cases for every reported input position. Reconciled the canonical plan and historical WU-30 record additively without claiming `0.1.1` delivered.
- Focused RED evidence reproduced every code finding; focused GREEN and the complete 78-test package suite passed.
- Cycle 2 re-reviewed staged diff `81560a72d4285bf0f1711594f8884a12947a7cc2fe93af014319835fba7f4718` with three independent agents. Two approved it; the Git-process reviewer found one High: mixed-case remotes such as `foo` and `Foo/bar` overlap on case-insensitive filesystems but the namespace guard compared case-sensitively, allowing fetch to mutate the aliased tracking ref.
- Added a synthetic mixed-case fixture that failed by fetching and mutating instead of rejecting, then case-folded namespace comparison before fetch. Focused GREEN and the complete 79-test package suite passed. Fresh independent re-review of the new stable bytes remains required.
- Cycle 3 re-reviewed staged diff `ac74223b491c438d4c1c29b3e6aabd13b60f2f7f2ab5cfb287b8a1dcb16138b6` with three independent agents. All three approved the exact stable bytes with no Critical, High, Medium, or acceptance-related Minor finding; the candidate hash matched before and after every review.
- Cycle 4 re-reviewed staged portability repair `6b297d95adbdf1fef7e799d28e00c7b17a497a56a7044c266a95dab053c30173` with three independent agents. All approved with no required finding and stable before/after hashes. They independently confirmed direct remote configuration is enumerated by Git and still exercises same-case and case-folded conflict rejection before fetch, tracking-ref mutation, or `FETCH_HEAD` change; product code remained unchanged.
- Time/scope check at `2026-07-31T12:04:15+03:00`: recovery remains proportional to the accepted WU-30 defects and CI portability failure. Scope is still one private patch package, one recovery PR, exact artifact replacement, and truthful closure; WU-31 remains blocked.

## Final verification

Result: passed

- Focused acceptance matrix: `pnpm --filter @jz/ai-arsenal-weekly-report-cli exec jest --runInBand --coverage=false --runTestsByPath src/arguments.test.ts src/evidence-schema.test.ts src/cli.test.ts src/git-collector.test.ts test/process.e2e.test.ts` — exit `0`; 76 focused tests across five suites passed.
- Full repository gate: `pnpm check` — exit `0`; formatting, lint, typecheck, all package tests, 55 workflow tests with one documented Windows privilege-dependent skip, and both workflow validators passed. Weekly-report CLI totals were seven suites and 79 tests.
- Distribution gates: strict `publint --pack` and the clean packed-consumer distribution test — exit `0`; the exact eight-file boundary installed and executed successfully.
- Workflow and diff gates: living-workflow validator, selected-item validator, and `git diff --check` — exit `0`; the item routed correctly through verification and all changed paths matched the implementation summary.
- Privacy inspection — exit `0`; added-line scans found zero credential assignments, consumer identifiers, or shell-execution constructs. Independent reviewers also proved credential-bearing rejected values and repository paths were absent from both output streams.
- Reviewed product snapshot remained unchanged from approved staged digest `ac74223b491c438d4c1c29b3e6aabd13b60f2f7f2ab5cfb287b8a1dcb16138b6`; the verification snapshot including review/stage evidence had deterministic diff digest `7f3cebc25d053f5c02909be120d65232bf6c516ec357fad6a9fcd5b5b5014851`.
- Exact-commit Quality CI for `7c53b30e4e7c1c6584b813f591916f5ee24ea6ff` failed on Linux because current Git rejects `git remote add foo/bar` when `foo` already exists before the collector runs. Portability CI itself passed on Windows and Linux. Verification returned to review; the fixture now writes the equivalent remote configuration directly so every Git version can exercise the collector guard, and focused namespace tests pass locally. Fresh cycle-4 review and invalidated Quality CI remain required.
- After cycle-4 approval, replacement `pnpm check` — exit `0`; formatting, lint, typecheck, all package tests, 55 workflow tests with one documented Windows privilege-dependent skip, and both workflow validators passed. Weekly-report CLI remained seven suites and 79 tests. Living-workflow validation, selected-item validation, and `git diff --check` also exited `0`. Exact-commit replacement CI remains a delivery gate rather than local final verification.

## Delivery evidence

- Recovery PR: `https://github.com/jimzord12/ai-arsenal/pull/20`; implementation/artifact commit `0bd9416ae8b7fd4f99be390c31247844788f3905` matched the pushed branch before packing.
- Exact-commit CI passed: Quality `https://github.com/jimzord12/ai-arsenal/actions/runs/30618704374` and Portability `https://github.com/jimzord12/ai-arsenal/actions/runs/30618704403`; both report `headSha` `0bd9416ae8b7fd4f99be390c31247844788f3905`, and Portability passed Ubuntu plus Windows smoke. Failed Quality run `30617823955` at superseded commit `7c53b30e4e7c1c6584b813f591916f5ee24ea6ff` remains preserved as fixture-recovery evidence.
- Exact private artifact: `C:/Users/jimzord12/AppData/Local/Temp/wu30-recovery-0bd9416/jz-ai-arsenal-weekly-report-cli-0.1.1.tgz`; SHA-256 `60adadd364debf8dfe77b14a6634d70fbe203f8cfe356a11823fefecaaf505f7`. Inventory is exactly `README.md`, `package.json`, and `dist/{arguments,bin,cli,evidence-schema,git-collector,redaction}.js`.
- Clean unrelated consumer installed the exact tarball and passed version/help plus synthetic Git collection with schema `1`, status `verified`, one default-branch commit, no branches, and empty stderr.
- Preflight reported global `@jz/ai-arsenal-weekly-report-cli 0.1.0`; the exact tarball replaced it with `0.1.1`. All eight installed package files byte-match extracted tarball files. The generated native pnpm shim passed version/help and independent synthetic Git collection with schema `1`, status `verified`, one default-branch commit, no branches, and empty stderr.
- Safe rollback is `pnpm remove -g @jz/ai-arsenal-weekly-report-cli`; reinstalling defective `0.1.0` is intentionally not the preferred rollback. Registry publication, consumer-repository access, private-history collection, destructive cleanup, and WU-31 work did not occur. Disposable artifacts and synthetic repositories remain under the user temp directory.
- Final PR head `8798b27df4fcee8cc4392782eec73f0f12069c6b` integrated current `master` without weekly-report package changes and passed duplicate push/PR exact-commit Quality runs `30619300101` and `30619303071` plus Portability runs `30619299966` and `30619303032`; both Ubuntu and Windows jobs passed.
- PR `#20` merged by squash at default-branch commit `0f6dee6abc3e689ffb7e743649451335a00b288b`. After fetch, local detached default-branch HEAD equaled `origin/master`, `git diff 0bd9416ae8b7fd4f99be390c31247844788f3905..0f6dee6abc3e689ffb7e743649451335a00b288b -- packages/weekly-report-cli` was empty, repacking from final CI-green PR head reproduced SHA-256 `60adadd364debf8dfe77b14a6634d70fbe203f8cfe356a11823fefecaaf505f7`, and the global shim reported `weekly-report-cli 0.1.1`.
- Trello WU-30 evidence was patched with the merged PR, permanent default-branch work-item link, final CI revision, artifact checksum, installation, and smoke summary. Guarded dry-run/read/write/read-back transitions moved `in_progress` version `2026-07-31T09:24:01.949Z` to `review` version `2026-07-31T09:24:28.736Z`, then to `done` version `2026-07-31T09:24:52.666Z`; owner remained `hermes-greek-essence`. The Done card was not archived.
- Delivery is complete. WU-31 is no longer dependency-blocked but was not started by this recovery.
