Work item: 2026-07-29-open-standard-trello-agent-skills
Artifact: reconciliation
Revision: 1
Prerequisites: verification@1
Status: passed

# Resulting state

Exactly four canonical portable Agent Skills now exist under `.agents/skills/`: `trello-work-orchestrator`, `trello-work-design`, `trello-work-deliver`, and `trello-work-recover`. They implement the accepted package-owned workflow protocol, pass the official `skills-ref` reference validator pinned to upstream commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`, and have no unresolved Critical, High, or Medium fresh-review finding. `packages/trello-work-cli/assets/agent-skills-adapters.md` defines how Claude Code, Codex, Pi, Hermes Agent, and other clients derive mechanical adapters without changing lifecycle authority.

## Canonical-plan updates

- Replace the prior “skills proposed but not implemented” state with the four verified canonical source locations and official-standard evidence.
- Record the responsibility split: orchestrator is read-only; design owns intake through Ready; delivery owns normal Ready through Done; recovery owns exceptional outcomes.
- Record canonical-source/downstream-adapter semantics and the adapter guide.
- Resolve the risk that the four skills are unimplemented; carry forward distribution, actual harness installation, generated adapter, and production-board boundaries.
- Add the completed open-standard skill implementation to the phase map and maintenance-result state.
- Set the immediate next action to human review of the local uncommitted protocol/skills change and a separate decision on Git delivery; do not infer commit/push permission.

## NEXT.md update

Clear the active work item and pipeline step to `none`. Report the four skills and adapter guidance as verified local sources. Set exactly one next action: review the completed local diff and explicitly authorize or decline commit/push. Preserve separate approval gates for package/docs integration, generated adapters, harness installation, release/publication, production Trello mutation/migration, Git Bash remediation, automatic archival, and source deletion.

## Risks

- The skills are canonical repository sources but are not yet committed or pushed.
- No generated/client-specific adapter or actual client installation was produced; harness discovery mechanics remain client responsibilities until separately implemented.
- The skills and adapter guide are outside the Trello CLI packed boundary and offline docs.
- Project-level skills require client trust handling and deterministic collision behavior.
- Non-atomic Trello claim allocation and the noncanonical production Greek Essence board remain unchanged.
- The pre-existing offline guide still includes a deprecated `create` alias in recommended human-workflow prose; the new skills do not prescribe it.

## Next action

Human review the completed local protocol, four canonical Agent Skills, adapter guide, and work-item evidence; then explicitly authorize or decline commit/push as a separate Git delivery action.
