# Work Item

Work item: 2026-07-31-filter-trello-card-members
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-07-31T10:26:15+03:00
Max time: 6 hours
Last time check: 2026-07-31T10:26:15+03:00
Turns since time check: 2
Review cycles: 2
Required findings remaining: no
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Deliver a versioned private `jz-trello-flow` read contract that exposes native Trello card members and lets `list` filter Work Units by an involved Trello member while preserving and proving the existing metadata-owner filter as a separate responsibility.

## Non-goals

- Do not add, remove, assign, or synchronize Trello card members.
- Do not equate native Trello members with the single Work Unit metadata `owner`, automatically mirror either field, or change claim semantics.
- Do not treat card membership as authorization, exclusivity, or an atomic claim.
- Do not match non-unique display names, invent fuzzy matching, add board-wide people administration, or broaden search beyond the explicitly resolved board.
- Do not mutate a live or production Trello board, publish to a registry, migrate consumer projects, or change card descriptions, lists, status, attachments, or checklists.

## Acceptance criteria

- Trello card reads request and strictly normalize native nested members with stable `id`, `username`, and `fullName`; malformed member collections or entries fail closed as `TRELLO_RESPONSE_INVALID` without leaking credentials.
- Normalized Work Unit `get` and `list` output includes `card.members`; Inbox output includes `members` for both ordinary cards and Work Units. Empty membership is an explicit empty array, and member order is deterministic.
- `jz-trello-flow list --member <selector>` returns only Work Units whose card contains an exact member ID or exact case-insensitive Trello username match. Display-name and substring matching are unsupported, a non-match returns a successful empty list, and `--member` composes conjunctively with all existing filters.
- Existing `jz-trello-flow list --owner <stable-owner>` remains a distinct exact metadata-owner filter. Focused CLI/process tests prove owner-only, member-only, combined match, combined mismatch, empty-member, malformed-member, and ordinary-Inbox behavior.
- Help, built-in docs, README/work guide, command catalog, JSON/text examples, and the package-owned agent protocol clearly distinguish plural Trello members (assignment/attention) from the single Work Unit owner (execution claim).
- The implementation remains read-only, uses the existing Trello client and command boundaries without a new abstraction, preserves fail-closed Work Unit parsing and all other filters, and adds no credential, board identity, or consumer-specific fixture.
- Changesets produces the additive minor version; the exact packed boundary contains only the approved package files and passes package format/lint/typecheck/tests, strict publint, clean packed-consumer invocation, root gates, workflow validators, privacy scans, `git diff --check`, independent review, and required Quality/Windows/Linux Portability CI.
- After the exact artifact-bearing commit is CI-green, its tarball checksum, prior global state, rollback command, global replacement, installed version, generated-shim help/docs, member/owner filter smoke using an isolated local fake Trello transport or equivalent credential-free process seam, package-byte equality, remote SHA equality, clean worktree, and CI URLs are recorded before closure.

## Implementation summary

- Added strict native Trello member normalization to card reads. `listBoardCards` and `getCard` request `members=true` with `id,username,fullName`, reject malformed nested collections or entries as `TRELLO_RESPONSE_INVALID`, return explicit empty arrays, and sort members deterministically by ID. Mutation responses tolerate Trello omitting the nested expansion and normalize that omission to an empty array.
- Extended normalized Work Unit and Inbox output with card members, and added `list --member` as an exact member-ID or case-insensitive exact username filter. It composes conjunctively with the existing exact metadata `--owner` filter and all other filters; display names and substrings do not match.
- Updated the command catalog, built-in docs, README, work guide, and both byte-identical package-owned workflow protocol copies to distinguish plural Trello assignment/attention from the single stable execution owner.
- Added focused client, read-command, CLI-routing, documentation, Inbox, empty-membership, malformed-member, deterministic-order, mutation-response, and owner/member-composition tests. Updated existing typed card fixtures with explicit empty membership.
- Test-first evidence: the focused suites initially failed because members were absent from output, `--member` was rejected/ignored, and Inbox omitted membership; after implementation, the four focused suites passed 95 tests. The full package suite then passed 281 tests with 2 credential-gated live tests skipped across 22 suites.
- Changesets applied the approved additive minor bump from `0.4.2` to `0.5.0`, generated the changelog entry, and consumed `.changeset/calm-members-filter.md`. The versioned snapshot passes package formatting, lint, type checking, the version-sensitive test, and `git diff --check`.

## Review findings and repairs

- Cycle 1 found two acceptance-related Minor gaps: README wording incorrectly blurred card membership with Trello watching/subscription, and focused tests did not directly assert a non-null owner-only match or username-substring rejection.
- Repaired the README to define members strictly as card assignees and explicitly separate watching/subscription. Added direct owner-only exact-match and member username-substring non-match assertions.
- Re-review found no remaining required findings. Atlassian's current primary nested-resource documentation confirms card member expansion with `members=true` and member field selection; implementation, deterministic/fail-closed normalization, output shape, conjunctive filtering, read-only boundary, docs, packed boundary, and architecture fit satisfy the recorded contract.
- Cycle 2 followed failed final privacy verification: replaced every new `jim` / `Jim Example` example and fixture with neutral synthetic `dev-one` / `Developer One` values. This preserves case-insensitive exact and substring-negative coverage without consumer identity.
- Cycle 2 re-review passed package formatting, all four invalidated suites (95 tests), `git diff --check`, and a changed-diff privacy scan with no remaining required finding.

## Final verification

Result: passed

Attempt 1 result: failed

- `pnpm check` — the first two wrapper attempts exited `124` before execution because the command timeout was misconfigured to one second; the unchanged command then exited `0` with all root format/lint/typecheck/test/workflow gates passing. Trello package result: 22 suites, 281 passed, 2 explicit live skips. Workflow result: 55 passed, 1 Windows privilege skip.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — exit `0`; strict publint passed the packed package.
- `pnpm validate:trello-skills-official` — exit `1` as designed because required explicit provenance arguments were absent. Corrected command with `--checkout C:\Temp\asrepo2 --python C:\Temp\asref\.venv\Scripts\python.exe` exited `0`, proving all four transformed bundled skills against clean pinned commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test:live` — exit `0`; 12 credential-free safety tests passed and 2 explicitly opted-in live cases skipped, with no Trello mutation.
- Clean packed-consumer smoke — exit `0`; packed 32 approved files, installed `0.5.0` into unrelated temporary consumer `C:\Users\JIMZOR~1\AppData\Local\Temp\ai-arsenal-trello-verify-b6ae4a95433a4c43bac8b793fb08b0a3`, and generated-shim help plus member/owner concepts docs passed. Candidate SHA-256: `b7014b773a0d0832dff46274913dc645cb6400ffdc78c6181eebcffd02b0f701`. Temporary evidence remains intact.
- `git diff --check` — exit `0`.
- Privacy scan — failed: new examples and fixtures used `jim` / `Jim Example`, which is too close to consumer identity and violates the explicit no consumer-specific fixture criterion. Return to review for a neutral synthetic identity repair; all other observed gates passed.

Attempt 2 result: passed

- `node scripts/validate-monorepo-work-item.mjs --current --json` — exit `0`; valid `verify-monorepo-change` route with two completed review cycles and no required finding.
- `pnpm check` — exit `0` in 51.3 seconds; root format/lint/typecheck gates passed, all package tests passed, Trello package passed 22 suites with 281 tests and 2 explicit live skips, workflow tests passed 55 with 1 Windows privilege skip, and both workflow validators passed.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — exit `0`; strict publint passed the actual packed package.
- `pnpm validate:trello-skills-official -- --checkout C:\Temp\asrepo2 --python C:\Temp\asref\.venv\Scripts\python.exe` — exit `0`; all four transformed bundled skills passed official validation against clean pinned commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test:live` — exit `0`; 12 credential-free safety cases passed and 2 explicitly opted-in live cases skipped. No Trello access or mutation occurred.
- Clean packed-consumer smoke — exit `0`; the 32-file `0.5.0` tarball installed into unrelated temporary consumer `C:\Users\JIMZOR~1\AppData\Local\Temp\ai-arsenal-trello-verify-65154e39579f4692a91c1655332faacb`, and its generated shim exposed list plus version-matched member/owner matching docs. Candidate SHA-256: `42e57a200b47d4bc020da186eacb7023d12148d1472cc12f422b9c94e4d88be0`. Temporary evidence remains intact.
- Changed-path/privacy/manual audit — all 25 changed product/test/doc paths are within the compact contract; native member reads remain non-mutating; `jim`, consumer identifiers, board identities, credential names/values, and Greek Essence produced zero changed-diff matches. The package-owned source/bundled protocols remain byte-identical at SHA-256 `84f7c0f6d4022555135d59829b10837065156d6714c4e750aab179497b28fec4`.
- `git diff --check`, `node scripts/validate-living-workflow.mjs`, and `node scripts/validate-monorepo-work-item.mjs --current --json` — all exited `0` on the final verified snapshot.

## Delivery evidence

- Artifact-bearing commit `e9c005a2391b21c3add345203276bf720e1f48c6` matched local `HEAD`, `origin/master`, and both required CI `headSha` values before packing. Quality run `30614651328` (`https://github.com/jimzord12/ai-arsenal/actions/runs/30614651328`) and Portability run `30614651510` (`https://github.com/jimzord12/ai-arsenal/actions/runs/30614651510`) passed on that exact commit, including Ubuntu and Windows process/distribution jobs.
- Exact release tarball `jz-ai-arsenal-trello-work-cli-0.5.0.tgz` contains the verified 32-file boundary and has SHA-256 `42e57a200b47d4bc020da186eacb7023d12148d1472cc12f422b9c94e4d88be0`.
- Preflight proved the prior global version was `0.4.2`. Exact rollback command is `pnpm add --global "C:\Users\jimzord12\AppData\Local\Temp\ai-arsenal-trello-release-ea8c0a8627b7\packed\jz-ai-arsenal-trello-work-cli-0.4.2.tgz"`; that retained artifact has the recorded SHA-256 `ff6706e7e4b3ded79c0977a2d59ddcfec70595e17c06ff07386092ce3773f391`.
- After the exact command, paths, replacement consequence, and rollback were presented, the user explicitly approved. `pnpm add --global "C:\Users\jimzord12\AppData\Local\Temp\ai-arsenal-trello-release-e9c005a2391b\packed\jz-ai-arsenal-trello-work-cli-0.5.0.tgz"` exited `0`; pnpm reported global `@jz/ai-arsenal-trello-work-cli 0.5.0`.
- Independent global verification resolved the installed package under `C:\Users\jimzord12\AppData\Local\pnpm\global\v11\6918-19fb73689ec\node_modules\@jz\ai-arsenal-trello-work-cli` and the generated PowerShell shim under the pnpm global bin directory. All 32 package files byte-matched the tarball; the only three installed extras were generated `.bin` shims.
- Generated-shim help and version-matched concepts docs exposed `list`, `--member`, `--owner`, and the display-name/substring exclusions. An installed-source fake-client smoke returned counts `{ member: 1, owner: 1, combined: 1, mismatch: 0, displayName: 0 }` and the expected member object, proving exact member/owner composition without credentials, network, or Trello access.
- Registry publication, consumer-project mutation, live/production Trello access, and destructive cleanup did not occur. Candidate, release, byte-proof, and smoke evidence directories remain under the user temp directory.
