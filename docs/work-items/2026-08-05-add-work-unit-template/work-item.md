# Work Item

Work item: 2026-08-05-add-work-unit-template
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-08-05T00:29:31+03:00
Max time: 4 hours
Last time check: 2026-08-05T00:29:31+03:00
Turns since time check: 1
Review cycles: 1
Review status: passed
Review snapshot: sha256:45aa880d5f999401b0110c119011eafbec3d1c88848b8d2e62a7895df28ae860
Review batch: review-20260805-work-unit-template-successor-01
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260805-work-unit-template-successor-01","snapshot":"sha256:45aa880d5f999401b0110c119011eafbec3d1c88848b8d2e62a7895df28ae860"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260805-work-unit-template-successor-01","snapshot":"sha256:45aa880d5f999401b0110c119011eafbec3d1c88848b8d2e62a7895df28ae860"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none
Worktree: isolated
CLI local-delivery evidence: required
CLI release preparation: {"status":"complete","package":"@jz/ai-arsenal-trello-work-cli","version":"0.8.0","manifest":"packages/trello-work-cli/package.json","changelog":"packages/trello-work-cli/CHANGELOG.md"}

## Goal

Add a small offline `jz-trello-flow template` command that prints one canonical, immediately valid Work Unit draft for local editing and existing `validate --file` use.

## Non-goals

- Change Trello credentials, board resolution, mutations, lifecycle authority, validation rules, or optimistic-concurrency safeguards.
- Add template customization, interactive prompting, remote lookups, new configuration, template registries, or abstractions beyond the existing canonical Work Unit model.
- Reuse the predecessor's review evidence, exceed four fresh review cycles, implement other issue #21 children, publish a registry package, merge or delete branches/worktrees, or make live Trello mutations outside established test boundaries.

## Acceptance criteria

- `jz-trello-flow template` emits canonical Work Unit Markdown with exactly one YAML fence and concise supported-metadata guidance where needed.
- Writing the output unchanged to a file makes `jz-trello-flow validate --file <file>` succeed.
- The command completes without Trello access, credentials, board selection, or mutation.
- Focused offline and process-level tests prove the emitted document and credential-free command behavior.
- Only the predecessor's product candidate is imported; its compact record, routing state, review snapshots, batches, and cycle count remain historical and are not reused.
- The private Trello CLI receives the appropriate Changeset-derived SemVer release during implementation, and its manifest, changelog, and complete release-preparation declaration are included in a fresh review candidate.
- The exact reviewed package passes package and repository gates, installs in a clean disposable consumer, and replaces the global package only from the exact pushed CI-green artifact-bearing commit with rollback, shim repair, cross-shell smoke, installed-artifact provenance, and durable delivery evidence.

## Implementation summary

Imported only the six predecessor product files: `src/cli.ts`, `src/work-unit.ts`, `src/command-catalog.ts`, `src/docs.ts`, `src/cli.test.ts`, and `src/docs.test.ts`. The command renders through the existing canonical Work Unit model and dispatches before configuration or Trello access; no predecessor routing or review evidence was copied.

Changesets applied one minor bump for `@jz/ai-arsenal-trello-work-cli`, consumed the sole new Changeset, and generated version `0.8.0` plus its changelog entry. No unrelated package or lockfile changed.

Focused evidence: the predecessor recorded the intended initial unknown-command failure before implementation. In this successor, the focused CLI/docs suites passed 108 tests; Trello CLI typecheck and lint passed; direct `bun packages/trello-work-cli/src/bin.ts template` emitted one canonical credential-free Draft with the required enum guidance.

## Review findings and repairs

Cycle 1 (`review-20260805-work-unit-template-successor-01`, `sha256:45aa880d5f999401b0110c119011eafbec3d1c88848b8d2e62a7895df28ae860`) passed. Independent contract and quality reviewers returned matching successful results with no required findings.

## Final verification

Result: passed

- `pnpm check` — exit 0: formatting, lint, typecheck, all package suites, 320 passing Trello CLI tests with 2 approved live skips, 145 passing workflow tests with 2 platform skips, and both workflow validators passed.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli run validate` — exit 0: strict publint passed against the packed `0.8.0` package.
- `git diff --check` — exit 0.
- `node scripts/validate-living-workflow.mjs` and `node scripts/validate-monorepo-work-item.mjs --current --json` — exit 0; the complete release preparation and fresh matching review batch validated.
- Direct smoke: `bun packages/trello-work-cli/src/bin.ts template` emitted one canonical Draft with exactly one YAML fence and no Trello access.
- Clean consumer: packed the 32-file `jz-ai-arsenal-trello-work-cli-0.8.0.tgz`, installed it into an unrelated temporary pnpm consumer, invoked the installed `jz-trello-flow template`, and passed installed `validate --file` unchanged with `valid: true` and `kind: draft`.

## Delivery evidence

Delivery result: passed
Artifact-bearing commit: 957d8412da470686f6b42c90174ffe80b372014c
Remote ref equality: {"ref":"origin/work/2026-08-05-add-work-unit-template","sha":"957d8412da470686f6b42c90174ffe80b372014c","confirmed":true}
Required CI: [{"url":"https://github.com/jimzord12/ai-arsenal/actions/runs/30953856675","sha":"957d8412da470686f6b42c90174ffe80b372014c","conclusion":"success"},{"url":"https://github.com/jimzord12/ai-arsenal/actions/runs/30953856645","sha":"957d8412da470686f6b42c90174ffe80b372014c","conclusion":"success"}]
Package: {"name":"@jz/ai-arsenal-trello-work-cli","version":"0.8.0"}
Tarball: {"file":"jz-ai-arsenal-trello-work-cli-0.8.0.tgz","sha256":"68a38a394b892362c92ac78e36b70c2ca7504a41d6487d951daa68c5e87457e6","pack":"success"}
Global replacement: {"command":"pnpm add --global C:/Users/JIMZOR~1/AppData/Local/Temp/tmp.vB7NslnYAT/jz-ai-arsenal-trello-work-cli-0.8.0.tgz","result":"success","installedPackage":"@jz/ai-arsenal-trello-work-cli","installedVersion":"0.8.0"}
Installed-shim smoke: {"version":"passed","help":"passed","featureSmoke":"passed"}
Installed artifact provenance: {"artifactBytes":"confirmed","sourceTree":"not-used"}
Rollback: {"identity":"jz-ai-arsenal-trello-work-cli-0.7.0.tgz#sha256:bb8d22da2e8202c034823597aa4c5577dfe36b61cd2021074ca540a0daf10891","ready":true,"attempted":false,"result":"not-attempted"}
Clean worktree: {"confirmed":true}
