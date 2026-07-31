# Work Item

Work item: 2026-07-31-recover-git-evidence-collector
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-07-31T10:56:22+03:00
Max time: 8 hours
Last time check: 2026-07-31T10:56:22+03:00
Turns since time check: 4
Review cycles: 3
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

## Final verification

Result: passed

- Focused acceptance matrix: `pnpm --filter @jz/ai-arsenal-weekly-report-cli exec jest --runInBand --coverage=false --runTestsByPath src/arguments.test.ts src/evidence-schema.test.ts src/cli.test.ts src/git-collector.test.ts test/process.e2e.test.ts` — exit `0`; 76 focused tests across five suites passed.
- Full repository gate: `pnpm check` — exit `0`; formatting, lint, typecheck, all package tests, 55 workflow tests with one documented Windows privilege-dependent skip, and both workflow validators passed. Weekly-report CLI totals were seven suites and 79 tests.
- Distribution gates: strict `publint --pack` and the clean packed-consumer distribution test — exit `0`; the exact eight-file boundary installed and executed successfully.
- Workflow and diff gates: living-workflow validator, selected-item validator, and `git diff --check` — exit `0`; the item routed correctly through verification and all changed paths matched the implementation summary.
- Privacy inspection — exit `0`; added-line scans found zero credential assignments, consumer identifiers, or shell-execution constructs. Independent reviewers also proved credential-bearing rejected values and repository paths were absent from both output streams.
- Reviewed product snapshot remained unchanged from approved staged digest `ac74223b491c438d4c1c29b3e6aabd13b60f2f7f2ab5cfb287b8a1dcb16138b6`; the verification snapshot including review/stage evidence had deterministic diff digest `7f3cebc25d053f5c02909be120d65232bf6c516ec357fad6a9fcd5b5b5014851`.
