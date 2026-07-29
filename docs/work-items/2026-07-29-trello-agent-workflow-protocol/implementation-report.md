Work item: 2026-07-29-trello-agent-workflow-protocol
Artifact: implementation
Revision: 1
Prerequisites: contract@1,plan@2,approval@1
Status: ready

# Changed paths

- `packages/trello-work-cli/assets/agent-workflow-protocol.md` — created the approved package-owned normative protocol specification.

## Decisions

- Kept the protocol source under the Trello CLI package without adding it to `package.json`, the packed boundary, or `jz-trello-flow docs`.
- Defined Trello and `jz-trello-flow` as durable lifecycle authority while leaving engineering methodology to Superpowers or equivalent harness practice.
- Kept normal operation lightweight and concentrated strictness around explicit board selection, latest reads, version guards, durable operation identity, read-back, and exceptional recovery.
- Represented claiming truthfully as a recovery-aware owner-update plus transition sequence, not an atomic lock.
- Proposed exactly four follow-on skills: `trello-work-orchestrator`, `trello-work-design`, `trello-work-deliver`, and `trello-work-recover`; no archival skill is proposed.
- Preserved human ownership of final Done-card review and manual archival.

## Tests

- `pnpm exec prettier --check packages/trello-work-cli/assets/agent-workflow-protocol.md` — passed after applying Prettier to the created file.
- `cmd.exe /d /c "jz-trello-flow docs --topic safety"` — exited `0`; confirmed best-effort non-atomic `--if-version`, durable operation IDs, minimum mutations, and read-back requirements.
- `cmd.exe /d /c "jz-trello-flow docs --topic workflows"` — exited `0`; confirmed JSON automation, latest-version guards, durable operation IDs, and reconcile-after-ambiguous-outcome guidance.
- `node scripts/validate-living-workflow.mjs` — passed.
- `node scripts/validate-monorepo-work-item.mjs --current --json` — passed and remained routed to `implement-monorepo-change` before this report.
- `git diff --check` — passed.
- Structured protocol trace — passed for all canonical states and nine transitions, claim postconditions, minimal recovery branches, four skills, four harnesses, Superpowers boundary, human archival, explicit exclusions, and unchanged package boundary.
- No tests were added or changed because the approved implementation is documentation-only.

## Deviations

None.
