Work item: 2026-07-29-open-standard-trello-agent-skills
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Create the four Trello agent skills defined by the accepted agent workflow protocol as canonical Agent Skills open-standard sources. Other agent harnesses should create or adapt their own versions from these portable canonical skills rather than making harness-specific implementations authoritative.

## Desired outcome

Implement and verify open-standard versions of `trello-work-orchestrator`, `trello-work-design`, `trello-work-deliver`, and `trello-work-recover`, with `SKILL.md` as the portable source contract and progressive-disclosure supporting files only where justified. Document how Claude Code, Codex, Pi, Hermes Agent, and other compatible agents derive their own installation or adapter form without changing lifecycle authority.

## Constraints

- Use the official Agent Skills open standard published at `agentskills.io` as the portable source format.
- Treat `packages/trello-work-cli/assets/agent-workflow-protocol.md` as the normative lifecycle and responsibility contract.
- Keep Trello/`jz-trello-flow` authoritative for durable task state and keep Superpowers or equivalent harness practice responsible for software-design and implementation methodology.
- Keep ceremony light and enforce only safety-critical lifecycle, mutation, evidence, concurrency/idempotency, and recovery invariants.
- The canonical open-standard skills must not depend on one harness's hidden hooks, tool names, bootstrap behavior, or private skill metadata.
- Other agents and harnesses may create their own adapters from the canonical skills, but adapters must not change lifecycle authority or safety rules.
- Preserve the completed but uncommitted protocol work and its work-item evidence; do not treat it as unrelated dirty work.
- Do not mutate production Trello boards, add automatic card archival, publish or globally install packages, change the CLI packed boundary or offline docs, repair Git Bash, delete rollback sources, commit, or push without separate authority.

## User-provided context

- The accepted skill set is exactly `trello-work-orchestrator`, `trello-work-design`, `trello-work-deliver`, and `trello-work-recover`.
- The human user owns final review and manual archival of Done cards; no archival skill is required.
- Open-standard skill sources should be the reusable reference. Harness-specific versions are downstream adaptations, not competing workflow authorities.
- Official Agent Skills documentation describes a lightweight open format centered on a skill directory containing `SKILL.md`, with optional supporting resources for progressive disclosure.
- No unanswered user decision currently prevents repository orientation. Exact canonical source paths, validation tooling, adapter guidance, and distribution boundaries remain to be derived and approved through this work item.
