# Work Item

Work item: 2026-07-31-filter-all-open-trello-cards-by-member
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-07-31T11:32:41+03:00
Max time: 4 hours
Last time check: 2026-07-31T11:32:41+03:00
Turns since time check: 1
Review cycles: 1
Required findings remaining: no
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Deliver Trello Flow CLI `0.5.1` so `jz-trello-flow list --member <selector>` returns every matching visible/open card on the selected board—including ordinary cards and canonical Work Units—while excluding archived cards and preserving exact Work Unit metadata-filter semantics.

## Non-goals

- Do not return archived/closed cards or cards hidden by archived lists.
- Do not change `list` behavior when `--member` is absent, broaden display-name/substring matching, or change exact metadata `--owner` semantics.
- Do not make ordinary cards pretend to have Work Unit metadata; when a metadata filter is supplied, ordinary cards cannot satisfy it and are excluded.
- Do not add, remove, assign, or synchronize members; mutate TestingBoard or any production board; publish to a registry; or migrate consumers.

## Acceptance criteria

- Board-card reads explicitly request Trello's visible-card filter and continue to request strict nested member fields, so archived/closed cards and cards hidden by archived lists are excluded at the API boundary.
- With no `--member`, `jz-trello-flow list` retains its existing normalized-Work-Unit-only output and fail-closed behavior byte-for-byte except for unavoidable version/documentation text.
- With `--member`, matching occurs against every visible board card by exact member ID or case-insensitive exact username. Ordinary cards and canonical Work Units are returned using the established Inbox discriminated shapes: ordinary card fields plus `kind: ordinary`, or card fields plus `kind: work-unit` and nested normalized `workUnit`.
- With `--member` plus any Work Unit metadata filter (`--status`, `--type`, `--priority`, `--owner`, `--parent`, or `--label`), ordinary cards are excluded and matching Work Units must satisfy every filter conjunctively. `--owner` remains an exact metadata-owner match.
- Focused tests cover an ordinary matching card, a matching Work Unit, nonmatching/empty members, visible-filter request construction, archived-response exclusion assumptions at the transport contract, member ID/username matching, member-plus-owner match/mismatch, legacy no-member output, malformed claimed Work Units, JSON CLI routing, help/catalog, and docs.
- A read-only TestingBoard smoke proves the real `jimzordstam` query returns both ordinary “Test Card 01” and Work Unit “Test Draft Card 03”, while the equivalent owner-combined query excludes ordinary cards. No live mutation occurs.
- Changesets produces exactly patch version `0.5.1`. The reviewed exact artifact passes package/root/workflow gates, strict publint, clean packed-consumer invocation, privacy/diff checks, required exact-SHA Quality and Windows/Linux Portability CI, byte-proven global replacement with retained `0.5.0` rollback, and installed-shim plus read-only TestingBoard verification before closure.

## Implementation summary

- Added an explicit `filter=visible` Trello board-card query, requested the card `closed` field, and removed closed cards at the transport boundary while preserving strict nested `members`/`member_fields` reads.
- Added a member-filtered `list` path that classifies every matching visible card with the established Inbox discriminated shapes. Ordinary cards remain eligible only when no Work Unit metadata filter is active; canonical Work Units retain conjunctive metadata filtering and exact owner matching. The no-member path retains the legacy normalized Work Unit-only result.
- Reused the same classifier for Inbox and member-filter listings so claimed malformed Work Units continue to fail closed instead of silently becoming ordinary cards.
- Expanded transport, command, CLI-routing, malformed-card, exact legacy-output, help, and documentation coverage. Aligned the README, work guide, command catalog, generated docs source, and both byte-identical workflow-protocol copies.
- Test-first evidence initially failed because the transport omitted `filter=visible` and the read path discarded the ordinary matching card. The implemented snapshot passes formatting, ESLint, strict TypeScript, strict publint, and all 22 Trello package suites: 281 passed with two explicit live-test skips; coverage is 86.58% statements, 82.13% branches, and 95.87% functions.
- A read-only source-tree TestingBoard smoke returned exactly ordinary “Test Card 01” and Work Unit “Test Draft Card 03” for `--member jimzordstam`; adding `--owner nobody` returned no items. No live mutation occurred.
- With the user's explicit approval to consume the changeset, Changesets produced package version `0.5.1`, generated its changelog entry, and removed `.changeset/visible-member-cards.md` as designed.

## Review findings and repairs

- Cycle 1 found one acceptance-related Medium transport-contract issue. Atlassian's current nested-resource documentation defines `visible` as cards in lists that are not closed; it does not guarantee that archived cards inside an open list are excluded. Relying on `filter=visible` alone therefore could violate the user's “obviously not archived” requirement.
- Repaired the client by requesting `closed`, rejecting malformed responses that omit its Boolean value, filtering closed cards before normalization, and retaining `filter=visible` to exclude cards hidden by archived lists. The transport regression first failed by returning the closed fixture, then passed after the repair.
- Re-review found no remaining required findings. The four invalidated suites pass 95 tests; strict TypeScript, ESLint, and `git diff --check` also pass. The two bundled workflow-protocol copies remain byte-identical.

## Final verification

Result: passed

- `node scripts/validate-monorepo-work-item.mjs --current --json` — exit `0`; valid `verify-monorepo-change` route, review cycle 1, and no required findings.
- `pnpm check` — exit `0` in 52 seconds; root formatting, lint, strict TypeScript, all package tests, workflow tests, and both workflow validators passed. Trello passed 22 suites with 281 tests and two explicit live skips; workflow tests passed 55 with one Windows privilege skip.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — exit `0`; strict publint passed the actual packed package.
- `pnpm validate:trello-skills-official -- --checkout C:\Temp\asrepo2 --python C:\Temp\asref\.venv\Scripts\python.exe` — exit `0`; all four transformed bundled skills passed official validation against clean pinned commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test:live` — exit `0`; 12 credential-free safety cases passed and two explicitly opted-in mutation cases skipped. No Trello access or mutation occurred.
- Clean packed-consumer smoke — exit `0`; the 32-file `0.5.1` tarball installed into unrelated retained consumer `C:\Users\JIMZOR~1\AppData\Local\Temp\ai-arsenal-trello-verify-b25cfdb76214437982ce2fbf8d7abe63`. Its manifest proved version `0.5.1`, and the generated shim's help/concepts docs exposed all-visible-card member filtering, ordinary plus Work Unit shapes, and archived-card exclusion. Candidate SHA-256: `ee8671d777865cf1d9ff8de1d21c84d8e08dff70ca49602b0a172b4d90ebee66`.
- The clean-consumer harness first tried unsupported `--version` and `version` spellings, each exiting `2`; inspection confirmed this CLI has no public version command. The successful required proof uses installed manifest version plus generated-shim help/docs, matching established package behavior.
- Read-only TestingBoard source smoke — exit `0`; `list --member jimzordstam` returned exactly “Test Card 01” (`ordinary`) and “Test Draft Card 03” (`work-unit`), while adding `--owner nobody` returned zero items. No live mutation occurred.
- Changed-path/privacy/manual audit — all 15 tracked changed paths plus the compact work item are within contract; the changed product diff has zero consumer-identity, TestingBoard, Greek Essence, or credential-name matches. The two workflow-protocol copies are byte-identical at SHA-256 `3d00d4d3d04595b9fe9daa436e3f3ca1bdaa0f2207165248fd5857e7d28d1d19`; package/changelog both prove `0.5.1`.
- A post-application `pnpm changeset status` probe exited `1` because the package differs from `master` after the one-shot changeset was consumed. This command is a pre-versioning check, not a required post-versioning gate; the applied manifest and generated changelog are the durable version evidence.
- `git diff --check`, `node scripts/validate-living-workflow.mjs`, and `node scripts/validate-monorepo-work-item.mjs --current --json` — all exited `0` on the final stable snapshot.
