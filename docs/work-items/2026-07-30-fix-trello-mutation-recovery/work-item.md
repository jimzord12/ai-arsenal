# Work Item

Work item: 2026-07-30-fix-trello-mutation-recovery
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-07-30T19:35:54.015+03:00
Max time: 8 hours
Last time check: 2026-07-30T19:35:54.015+03:00
Turns since time check: 2
Review cycles: 1
Required findings remaining: no
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Release and locally install a backward-compatible Trello Work CLI patch that prevents oversized description-writing mutations before any write, emits compact collision-resistant operation records while preserving exact legacy replay recognition, reports transition dry-runs successfully through the executable, accepts explicitly resolved Open Questions without weakening the Ready gate, and installs matching size-aware guidance in the four managed Agent Skills.

## Non-goals

- Do not read, mutate, claim, transition, retry, or otherwise use Greek Essence WU-20, WU-19, its repository, or its GitHub state as implementation or test fixtures.
- Do not publish the private package to a registry, archive Trello cards, delete or rewrite legacy operation markers, weaken stale-version/replay/drift/read-back protections, or add speculative enterprise/migration machinery.
- Do not claim that the observed 13,176-character rejection proves a universal Trello limit; characterize exact local request construction and use authoritative or explicitly configured limits only.
- Do not perform live Trello mutations unless a later direct user instruction explicitly authorizes an isolated disposable board boundary; offline evidence and transport-level tests are the required baseline.

## Acceptance criteria

- Description-writing mutation paths construct and preflight the exact final serialized description before any write. A deterministic local error exposes non-secret current/proposed character and UTF-8 byte sizes, operation type, operation-record contribution, the enforced budget and basis, and a recovery-safe next action; boundary and no-write tests cover metadata update, description replace/patch, and transition without fabricating an explanation for the WU-20 anomaly.
- Newly written versioned operation records have bounded size independent of postcondition size and bind the operation ID, operation kind, and a collision-resistant digest of deterministic canonical postcondition bytes. Replay matching remains exact, conflicting reuse fails closed, canonicalization is tested for key-order stability and material-value differences, malformed records fail safely, and existing full Base64URL records remain readable and matchable without automatic deletion.
- `jz-trello-flow transition ... --dry-run` exits successfully in JSON and text modes through the real CLI wrapper, returns an inspectable no-write plan, and has an executable-level regression that prevents domain/wrapper result-shape drift.
- The `in_design -> ready` gate accepts only documented, explicitly resolved/empty Open Questions forms and continues to reject genuine questions plus every material `Pending:` entry; parser, transition tests, CLI documentation, protocol, and managed skills use the same semantics.
- The package-owned protocol and all four managed Trello skills instruct agents to preflight the exact payload, treat deterministic size/value rejection as unapplied until read-back proves otherwise, avoid blind retries/content loss, and distinguish a dry-run presentation failure from a mutation. Repository-owned installer byte/inventory/repeat checks prove the packaged and installed managed payloads remain aligned.
- A patch Changeset versions only `@jz/ai-arsenal-trello-work-cli`; the reviewed snapshot passes focused tests, the complete package and repository gates, workflow validators, strict packed-artifact validation, and clean disposable-consumer invocation.
- The exact reviewed commit is pushed and passes required Quality and Portability CI. That CI-green commit is packed, checksummed, installed/replaced through native global pnpm with a recorded rollback/preflight, and independently proves package name/version, generated shim, help/docs, transition dry-run behavior, compact-record/size-preflight behavior on disposable fixtures, and managed-skill installation bytes.
- Durable evidence records the package version, release and evidence SHAs, remote equality, CI URLs, tarball path/checksum, global install command and installed-version proof, smoke results, clean worktree, and confirms no Greek Essence or registry mutation occurred.

## Implementation summary

- Added a shared exact-description preflight in `packages/trello-work-cli/src/mutation.ts` using Atlassian's documented 16,384-character card-description limit. It reports non-secret current/proposed character and UTF-8 byte sizes, compact-record contribution, operation kind, limit basis, and a same-operation-ID recovery action before any write.
- Replaced newly generated full-payload Base64URL markers with bounded `v2` records containing an encoded operation kind and SHA-256 digest of recursively key-sorted canonical JSON bytes. Legacy markers remain exactly readable/matchable; compact checklist replay reconstructs candidate postconditions from observed stable IDs instead of weakening recovery.
- Applied the shared preflight to create/finalize, design-start, metadata/description update, transition, reconcile, and checklist record persistence paths.
- Normalized transition dry-run output to an inspectable `plan` accepted by `mutationCliResult`, including the exact proposed description, and added JSON/text executable regressions proving zero writes.
- Defined resolved Open Questions as omitted or one optional bullet containing `None`, `N/A`, or `No open questions` with optional terminal punctuation. Ready transition removes the resolved optional section; genuine questions and every `Pending:` entry remain fail-closed.
- Aligned `README.md`, built-in docs, package protocol, repository-managed skills, and packaged managed-skill bytes with exact-payload preflight and deterministic rejection recovery. Added `.changeset/calm-cards-recover.md` for a patch bump of only `@jz/ai-arsenal-trello-work-cli`; Changesets version application remains a delivery-stage operation.
- Focused evidence: the initial 86-test mutation/update/transition/CLI run failed on all four intended regressions; after implementation, 142 tests across ten affected suites passed. Package TypeScript checking passed. `node --test scripts/verify-trello-skills-install-bytes.test.mjs` passed 6 tests with the one expected Windows ordinary-file-symlink privilege skip. Focused Prettier/ESLint checks and `git diff --check` passed after formatting.
- No live Trello call, Greek Essence repository/card/PR access, registry publication, global installation, packing, commit, or push occurred during implementation.

## Review findings and repairs

- Cycle 1 consolidated three Medium acceptance findings: canonical digest key ordering used locale-sensitive comparison; create recovery treated a valid legacy full marker as conflicting because its final section/marker comparison expected the new compact bytes; checklist record-capacity preflight occurred only after the primary checklist mutation.
- Repaired canonical ordering with locale-independent UTF-16 key comparison and bounded the diagnostic operation-kind token. Create recovery now uses version-aware `operationRecordState` and compares marker-stripped caller sections, with a dedicated complete legacy-create replay regression. Checklist create/update/item-set now preflight prospective compact-record capacity before their primary mutation; create uses a fixed-width placeholder Trello ID because compact marker size is postcondition-size independent.
- Clarified managed design guidance and README wording to match the implemented optional terminal period exactly.
- Repair checks passed: 28 tests across `mutation.test.ts`, `create.test.ts`, and `checklist.test.ts`; package TypeScript checking; focused ESLint; formatting; and whitespace checks.
- Re-review found no remaining Critical, High, Medium, or acceptance-related Minor finding. Optional polish and out-of-scope live Trello characterization were not requested and remain excluded.

## Final verification

Result: passed

- `pnpm check` — exit 0. Repository format, package lint/typecheck/tests, workflow tests, and both workflow validators passed. Trello CLI: 22 suites, 274 passed, 3 skipped. Workflow tests: 53 passed, 1 Windows ordinary-file-symlink privilege skip. Current work-item validation remained valid at `verify`.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — exit 0. Strict publint packed the candidate and reported `All good!`.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test:live` — exit 0. Credential-free boundary: 12 passed, 2 explicitly opted-in live scenarios skipped; no Trello client was constructed for live mutation.
- `pnpm lint:root` — exit 0. Root ESLint passed.
- `pnpm changeset status` — exit 0. Only `@jz/ai-arsenal-trello-work-cli` is scheduled for a patch bump; no minor or major bump exists.
- `node scripts/validate-living-workflow.mjs` and `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-30-fix-trello-mutation-recovery --json` — exit 0. Living workflow passed and the compact item routed to verification before this evidence update.
- `git diff --check` — exit 0. No whitespace errors.
- Clean disposable consumer: packed `jz-ai-arsenal-trello-work-cli-0.4.0.tgz`, installed it with `pnpm add --dir <temp-consumer> --ignore-workspace <tarball>`, and invoked generated-shim `jz-trello-flow --help` plus `jz-trello-flow docs --topic safety`; all corrected criterion commands exited 0. Candidate SHA-256: `c69e3a8f63a714c9e0aa7c92fd034e0546cc6470eb50fc693b59643e8da34d0a`. This pre-version candidate is disposable verification evidence; delivery must apply the Changeset and later pack the exact CI-green release commit.
- Two disposable harness setup attempts were preserved: unsupported PowerShell `Select-Object -Single` left the tarball variable empty (exit 1), and `docs safety` used invalid positional syntax after install/help had already passed (exit 2). Compatible tarball selection and documented `docs --topic safety` then passed; neither failure exercised or changed product behavior.
- Manual byte observation — exit not applicable. All four `.agents/skills/trello-work-*` SHA-256 values exactly matched their package asset counterparts; canonical and packaged protocol hashes both equal `6682faf599b297fbefbacb9569722e0b5a5bf65bfbd0a2c240da3fcc322900b6`.
- Changed-path observation — exit not applicable. Every changed path belongs to the compact contract: Trello CLI source/tests/docs/assets, the four managed skill sources and package copies, one patch Changeset, `NEXT.md`, and this work item. No Greek Essence, registry, global pnpm, or live Trello state was read or mutated.
- Remaining failures: None.
- Delivery confirmation: the user replied `I approve` immediately after being shown the exact `pnpm version-packages` command, the deletion of `.changeset/calm-cards-recover.md`, and the generated `0.4.1` manifest/changelog consequence. This is the fresh execution-time confirmation required by the repository file-deletion checkpoint.
- Delivery candidate: approved `pnpm version-packages` completed and generated only `@jz/ai-arsenal-trello-work-cli@0.4.1` plus its changelog. The versioned package again passed format, lint, strict typecheck, all 274 tests, and strict publint. Clean candidate tarball SHA-256 `7d52253d335e9555d1fede9693955522611c8e58dfdbfae61469ace68d546035` installed into an unrelated pnpm consumer; generated shim help/docs passed, and direct packed-source smoke reported `{ "markerLength": 105, "versioned": true, "code": "DESCRIPTION_BUDGET_EXCEEDED" }`. This candidate is not the final install artifact until its exact commit passes CI.
- Release delivery: commit `59e04349e56d984bf22021a8dd1fb30f563b65e7` was pushed to `origin/master`; local and remote SHAs were equal and the worktree was clean. Exact-SHA Quality run `30564697419` (`https://github.com/jimzord12/ai-arsenal/actions/runs/30564697419`) and Portability run `30564697302` (`https://github.com/jimzord12/ai-arsenal/actions/runs/30564697302`) completed successfully.
- Exact post-CI artifact: the clean release commit packed `jz-ai-arsenal-trello-work-cli-0.4.1.tgz` at `C:\Users\JIMZOR~1\AppData\Local\Temp\ai-arsenal-trello-release-59e04349e56d\`; SHA-256 is `7d52253d335e9555d1fede9693955522611c8e58dfdbfae61469ace68d546035` and SHA-512 Base64 is `6Aw8dd7K6s+1C3SdIAXdsB+V63ap2z6jMEoWUT9iQF74oXAVxQIw1sU4OfBJhBy5mfCRryYnN7PG/uo1mB9flw==`.
- Global-install provenance: preflight observed that a concurrent prior process had already registered `@jz/ai-arsenal-trello-work-cli@0.4.1` through native global pnpm from `C:\c\Users\jimzord12\AppData\Local\Temp\ai-arsenal-trello-cli-repair\.artifacts\jz-ai-arsenal-trello-work-cli-0.4.1.tgz`. That source tarball's SHA-256 and the deployment lockfile's SHA-512 integrity exactly equal the post-CI artifact values above, so no redundant global overwrite was performed. `pnpm list -g --depth=0` reports the exact package/version, the generated `jz-trello-flow` shim runs help and `docs --topic safety`, and installed-source smoke reports a compact versioned marker plus `DESCRIPTION_BUDGET_EXCEEDED` before write.
- Installed managed-skill proof: from the global shim, first and repeat `skills install` runs succeeded in unrelated disposable Git repository `C:\Temp\ai-arsenal-trello-delivery-a71e886ac04c\consumer repo Ω`. Repository-owned verification proved all 12 managed files byte-match the exact unpacked post-CI payload, the repeat manifest is identical (SHA-256 `25f634b6bde261d7429b817a9ea2f73d29cb05333e79cfd8dde4dfdd0d16a062`), and unrelated sentinel SHA-256 `4818de1c16b9b00826d42fd3cd59dce4bfd85a82bb43911bcba6d9a0be0f09e6` remained unchanged.
- Boundary confirmation: no Trello API call, Greek Essence card/repository/PR access, registry publication, or source-tree global link occurred. Remaining delivery work is limited to committing this durable evidence, passing exact-SHA Quality and Portability CI for it, then closing and clearing the active item.
