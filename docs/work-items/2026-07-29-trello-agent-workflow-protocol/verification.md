Work item: 2026-07-29-trello-agent-workflow-protocol
Artifact: verification
Revision: 1
Prerequisites: contract@1,plan@2,implementation@1
Status: passed

# Commands

1. `git status --short` and changed-path inspection — acceptance criteria 10 and safety boundary.
2. `pnpm exec prettier --check packages/trello-work-cli/assets/agent-workflow-protocol.md` — documentation formatting.
3. `pnpm --filter @jz/ai-arsenal-trello-work-cli format` — package-wide Markdown/source formatting.
4. `cmd.exe /d /c "jz-trello-flow docs --topic safety"` — CLI concurrency, idempotency, mutation, and read-back accuracy.
5. `cmd.exe /d /c "jz-trello-flow docs --topic workflows"` — CLI recommended agent workflow accuracy.
6. `node scripts/validate-living-workflow.mjs` — living workflow validity.
7. `node scripts/validate-monorepo-work-item.mjs --current --json` — current artifact route and prerequisite validity.
8. `git diff --check` — whitespace validity.
9. `grep -n 'agent-workflow-protocol' packages/trello-work-cli/package.json packages/trello-work-cli/src/docs.ts packages/trello-work-cli/src/command-catalog.ts` — confirms no packed-boundary or docs-catalog integration.
10. Structured protocol trace against all ten contract acceptance criteria, the nine canonical transitions, claim postconditions, recovery branches, four proposed skills, four harnesses, authority boundaries, explicit exclusions, and deferred package integration.
11. Manual inspection of `packages/trello-work-cli/assets/agent-workflow-protocol.md` against `change-contract.md`, `implementation-plan.md@2`, current CLI documentation, and the implementation report.

## Exit codes

1. Changed-path inspection: `0`.
2. Protocol Prettier check: `0`.
3. Package format check: `0`.
4. Safety docs: `0`.
5. Workflow docs: `0`.
6. Living-workflow validator: `0`.
7. Work-item validator: `0`.
8. `git diff --check`: `0`.
9. Packed/docs integration search: no matches, as expected; the audit command completed successfully.
10. Final structured trace: `0`. An earlier checker revision exited `1` because it searched for the literal phrase `zero production-board mutation` instead of the equivalent implemented text `performs no production-board mutation`; inspection proved the required matrix row existed, and the corrected matcher passed without changing product documentation.
11. Manual observations: Not applicable.

## Observed result

- Changed paths are limited to the pre-existing `NEXT.md` reconciliation/routing, the current work-item artifacts and revision history, and the approved protocol file.
- The protocol defines actors, authority order, all canonical lifecycle and recovery routes, evidence expectations, review/completion judgment, human archival, and truthful non-atomic claim behavior.
- All nine normal/exception transitions are present in the normative transition table.
- `--if-version`, durable `--operation-id`, immediate reads, read-back verification, replay recovery, and reconcile-before-repair behavior match the installed `jz-trello-flow@0.3.0` documentation.
- Superpowers owns design and implementation practice; Trello skills own durable coordination. Hermes does not claim unsupported native Superpowers integration.
- Exactly four lightweight follow-on skills are specified with triggers, inputs, permitted mutations, outputs, and non-responsibilities.
- The future verification matrix covers structure, lifecycle, claims, concurrency, idempotency, recovery, evidence, completion, archival, harness adapters, Superpowers boundaries, and zero production-board mutation.
- `package.json`, the packed file list, `src/docs.ts`, and `src/command-catalog.ts` do not reference the new protocol. Packing/docs integration remains deferred.
- No Trello mutation, package source/test change, release, publication, installation, skill implementation, Git history mutation, or source deletion occurred.

## Status

Passed.

## Remaining failures

None.
