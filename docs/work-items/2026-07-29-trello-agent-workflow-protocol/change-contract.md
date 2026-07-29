Work item: 2026-07-29-trello-agent-workflow-protocol
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Goal

Produce one repository-owned, cross-harness protocol specification that defines the complete Trello-backed Work Unit lifecycle, the authoritative boundary between `jz-trello-flow` and Superpowers, and the exact portable skill set and verification strategy proposed for a separately approved implementation work item.

## Non-goals

- Implementing, installing, or distributing any agent skill or Superpowers integration.
- Changing `jz-trello-flow`, its public commands, schema, transition graph, package, or tests.
- Adding attachment-upload behavior or making Trello cards self-contained artifact stores.
- Initializing, migrating, renaming, or otherwise mutating any production Trello board or card.
- Repairing the known Git Bash global pnpm shim incompatibility.
- Publishing packages, changing global installations, deleting rollback sources, or archiving Trello cards.
- Prescribing Superpowers' internal artifact filenames, hidden hooks, tool names, or implementation methodology beyond the accepted responsibility boundary.
- Implementing the separately proposed follow-on skill set under this work item.

## Hard walls

- Begin with bounded discovery and design; do not implement skills until the protocol and responsibility boundaries are accepted and the plan is approved.
- Trello and `jz-trello-flow` are authoritative for durable task state. Superpowers owns software-design and implementation practice and supplies evidence to Trello gates.
- Keep the workflow lightweight: enforce safety-critical invariants without unnecessary ceremony and otherwise allow agent judgment.
- Claiming must be represented as a recovery-aware multi-step postcondition, never as an atomic Trello transaction or lock.
- Canonical Work Unit sections retain concise evidence summaries and repository links; detailed artifacts remain in the repository, with Git and CI as authoritative evidence.
- Completion may rely on agent judgment only when acceptance criteria are satisfied, applicable verification has passed, no known blocker remains, and concise evidence is recorded.
- Recovery reads before retrying, reuses the same operation ID, and never blindly overwrites conflicting state.
- `Done` is the agents' terminal state. Human users alone own final review and manual card archival.
- The protocol must work through Claude Code, Codex, Pi, and Hermes Agent without depending on one harness's hidden behavior or claiming native Superpowers support where unavailable.
- Do not mutate production Trello boards, publish packages, delete rollback sources, or continue into skill implementation under this work item.
- Preserve the pre-existing uncommitted `NEXT.md` reconciliation.

## Acceptance criteria

1. One normative protocol specification defines actors, authority order, canonical lifecycle states, creation/intake, clarification, readiness, claiming, progress updates, review, completion, blocking, recovery, and human archival ownership.
2. The protocol maps every lifecycle transition to its minimum preconditions, required read-back/postcondition, concise evidence expectation, and allowed recovery route without inventing unsupported CLI atomicity.
3. The protocol defines portable concurrency and idempotency rules using current CLI capabilities: immediate reads, `--if-version`, durable `--operation-id`, read-back verification, replay recognition, and reconcile-before-repair behavior.
4. The protocol states the Trello/CLI versus Superpowers boundary across design, planning, implementation, testing, review, verification, state transitions, and completion.
5. The protocol remains harness-neutral and includes explicit adaptation requirements for Claude Code, Codex, Pi, and Hermes Agent, including the absence of verified native Superpowers support in Hermes.
6. The protocol keeps normal operation lightweight and makes additional evidence or recovery ceremony conditional on task requirements or exceptional outcomes.
7. The specification proposes the exact follow-on skill set, with each skill's trigger, responsibility, permitted mutations, required inputs/outputs, and explicit non-responsibilities.
8. The specification defines a follow-on verification strategy covering static skill structure, command examples, disposable/offline lifecycle scenarios, cross-harness loading/adaptation, concurrency/replay/recovery cases, responsibility-boundary checks, and zero production-board mutation.
9. The specification clearly states that CLI attachment upload is unsupported, production-board migration is unapproved, Git Bash shim repair is out of scope, and human users manually archive Done cards.
10. No skill implementation, CLI behavior change, package release, global installation, production Trello mutation, or Git-history mutation occurs in this work item.

## Test seams

- Trace each canonical transition and exceptional route against the installed `0.3.0` command and transition contracts.
- Trace each accepted interview decision to one normative protocol rule and at least one lifecycle or boundary section.
- Validate that every proposed skill has one bounded owner and does not duplicate Superpowers engineering practice.
- Review all command examples for explicit board selection, JSON automation output, latest-version guards, durable operation IDs, and read-back behavior where mutation is described.
- Exercise the documented claim and recovery algorithms as state tables or disposable/offline scenarios, including already-satisfied, unchanged, stale-version, replayed, ambiguous, and conflicting outcomes.
- Compare harness adapters to a common portable core so Claude Code, Codex, Pi, and Hermes do not acquire different lifecycle authority.
- Search the proposed protocol and plan for unsupported attachment upload, atomic-lock claims, automatic archival, production-board mutation, mandatory hidden hooks, or implementation of skills.
- Run repository Markdown formatting, workflow validation, and whitespace checks on the final documentation snapshot.

## Verification

- **Protocol completeness:** a structured traceability review demonstrates coverage of all ten acceptance criteria and all accepted design decisions.
- **CLI accuracy:** compare lifecycle, mutation, safety, output, and recovery claims with `packages/trello-work-cli/README.md`, the version-matched offline guide, installed `jz-trello-flow@0.3.0` docs, and current tests; record that no live mutation is required.
- **Superpowers boundary accuracy:** compare responsibilities with the inspected upstream Superpowers documentation at its recorded commit and avoid claims of native Hermes support.
- **Cross-harness portability:** inspect each proposed adapter/installation target and verify that the normative core does not depend on harness-specific hidden behavior.
- **Repository gates:** `pnpm exec prettier --check <changed-markdown-paths>`, `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-trello-agent-workflow-protocol --json`, `node scripts/validate-living-workflow.mjs`, and `git diff --check` must pass at the applicable handoff.
- **Safety audit:** `git diff --name-only` must show only approved documentation, work-item artifacts, and required `NEXT.md`/canonical-plan reconciliation paths; Trello and package/global state remain unchanged.

## Approval required

Yes. The repository pipeline requires explicit approval of the exact digest-bound implementation plan before the documentation implementation stage. That approval authorizes only the protocol specification and follow-on skill-set/verification design described here, not skill implementation, CLI changes, releases, global installation, production Trello mutation, or source deletion.
