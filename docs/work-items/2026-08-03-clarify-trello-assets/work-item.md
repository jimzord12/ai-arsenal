# Work Item

Work item: 2026-08-03-clarify-trello-assets
Workflow: 2
Stage: deliver
Status: active
Started at: 2026-08-03T00:00:00Z
Max time: 90 minutes
Last time check: 2026-08-03T00:00:00Z
Turns since time check: 1
Review cycles: 1
Review status: passed
Review snapshot: sha256:a9ad11b70aeeba205848716965cf41d270c62463a9f5500ae8a0424ae57ba4b7
Review batch: 2026-08-03-clarify-trello-assets-review-1
Review expected: ["implementation-integrity"]
Review received: [{"reviewer":"implementation-integrity","outcome":"passed","batchId":"2026-08-03-clarify-trello-assets-review-1","snapshot":"sha256:a9ad11b70aeeba205848716965cf41d270c62463a9f5500ae8a0424ae57ba4b7"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Clarify the Trello Work CLI asset documentation so Superpowers is explicitly optional and equivalent engineering practice is always valid, while documenting the intentional canonical-versus-packed protocol duplication without breaking `skills install` or the package artifact.

## Non-goals

- Do not change Trello lifecycle semantics or CLI behavior.
- Do not delete either protocol copy unless verification proves the package and installer no longer require it.
- Do not alter the four bundled skill directories or publish a package.

## Acceptance criteria

- All user-facing Markdown in `packages/trello-work-cli/assets` clearly states that Superpowers is recommended/optional, never a prerequisite or expected dependency.
- The asset documentation identifies `assets/agent-workflow-protocol.md` as the development canonical source and the identical `assets/agent-skills/agent-workflow-protocol.md` as the packaged self-contained payload copy, including the installer/package-boundary reason.
- Focused tests and package validation prove the installer still stages the expected protocol and the packed artifact remains valid.
- The work-item review and final verification evidence are recorded, and workflow validators pass.

## Implementation summary

- Updated the canonical protocol, adapter guide, and three bundled skill documents to state that Superpowers is optional recommended support and that equivalent practice is valid.
- Kept the two identical protocol files intentionally: the top-level asset is the repository source and the nested copy is required in the packed `agent-skills` payload consumed by `skills install`.
- Synchronized the three changed bundled skills with their canonical `.agents/skills` sources.
- Focused `skills-install.test.ts` passed: 13 tests; package formatting and strict publint validation passed.

## Review findings and repairs

- No Critical, High, Medium, or acceptance-related Minor findings.
- Confirmed the duplicate protocol is intentional: runtime installation reads the bundled nested copy, while development and source parity use the top-level copy; both are byte-identical.
- Confirmed canonical `.agents/skills` files match the package-bundled skill files.

## Final verification

Result: passed

- `pnpm --filter @jz/ai-arsenal-trello-work-cli format` — exit 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli lint` — exit 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck` — exit 0.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli test` — exit 0; 22 suites, 285 passed, 2 skipped.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — exit 0; strict publint passed.
- `node scripts/validate-living-workflow.mjs` — exit 0.
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-08-03-clarify-trello-assets --json` — exit 0; valid verify state.
- `git diff --check` — exit 0.
- The top-level and nested protocol assets have identical SHA-256 `85eb64a409d39bfd482d056337f028e71e829af67136c4e5235626fadc80c2a9`.
