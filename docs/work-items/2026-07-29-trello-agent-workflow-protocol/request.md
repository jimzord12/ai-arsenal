Work item: 2026-07-29-trello-agent-workflow-protocol
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Design the Trello-backed development workflow protocol for users who clone AI Arsenal and work through Claude Code, Codex, Pi, or Hermes Agent using `jz-trello-flow`, while keeping software-design and code-implementation practice under the Superpowers responsibility boundary.

## Desired outcome

Produce a reviewed protocol specification covering the complete Trello task lifecycle and cross-harness/Superpowers authority boundary, plus an approved implementation plan that identifies the exact portable agent-skill set and verification strategy. Skill implementation is a separate follow-on change.

## Constraints

- Begin with bounded discovery and design; do not implement skills until the protocol and responsibility boundaries are accepted and the plan is approved.
- Define creation, clarification, claiming, updates, transitions, review, completion, recovery, and archival semantics.
- Cover lifecycle authorities, evidence requirements, concurrency and idempotency, failure recovery, and cross-harness compatibility.
- Trello and `jz-trello-flow` are authoritative for durable task state. Superpowers owns software-design and implementation practice and supplies evidence to Trello gates.
- Keep the workflow lightweight: enforce safety-critical invariants without unnecessary ceremony and otherwise allow agent judgment.
- Do not mutate production Trello boards, publish packages, delete rollback sources, or continue into skill implementation under this work item.
- Preserve the pre-existing uncommitted `NEXT.md` reconciliation.

## User-provided context

- Claiming is a recovery-aware operation whose intended postcondition is `Ready` to `In Progress` with a stable owner and durable operation ID; work starts only after read-back confirms both owner and status.
- Canonical Work Unit sections retain concise evidence summaries and repository links. Detailed artifacts remain in the repository, with Git and CI as their authoritative evidence. The protocol does not depend on attachment upload support.
- An agent may transition `Review` to `Done` when it judges the acceptance criteria satisfied, applicable verification passed, and no known blocker remains. It provides concise evidence, without mandatory artifact formats, tools, or independent review unless the Work Unit requires them.
- Recovery reads before retrying: accept an already-satisfied postcondition, retry unchanged state once with the same operation ID and latest version, and reconcile or block on conflicting state. Recovery evidence is recorded only when task state or another agent is affected.
- `Done` is the agents' terminal state. The human user performs final review of Done cards and manually archives them; neither the CLI, Superpowers, nor agent skills own card archival.
- The installed `jz-trello-flow` version is `0.3.0`. Native Windows invocation works; the known Git Bash global-shim incompatibility remains a separate question and is not implicitly in scope.
- The current production Greek Essence board does not match the canonical seven-list workflow. Discovery does not authorize migrating it.
- No unanswered user decision currently blocks bounded protocol scoping; exact skill names, repository paths, and verification commands remain to be derived during orientation, scoping, and planning.
