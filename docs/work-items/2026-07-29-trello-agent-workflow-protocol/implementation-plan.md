Work item: 2026-07-29-trello-agent-workflow-protocol
Artifact: plan
Revision: 2
Prerequisites: contract@1
Status: ready

# Preconditions

- `change-contract.md@1` remains current and validates for `2026-07-29-trello-agent-workflow-protocol`.
- Root `AGENTS.md`, `NEXT.md`, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, the referenced canonical-plan sections, and package-scoped instructions remain authoritative.
- `packages/trello-work-cli/README.md`, `packages/trello-work-cli/assets/work-guide.md`, the installed native Windows `jz-trello-flow@0.3.0` documentation, and upstream Superpowers documentation at inspected commit `44c9b2d6e889982ac18c27d05a19fefe335194e1` remain the evidence baseline.
- Implementation is limited to one normative protocol document owned under the Trello CLI package. The package manifest, packed boundary, and `jz-trello-flow docs` integration remain unchanged. It must not create skills, change CLI behavior, mutate Trello, publish or install packages, repair Git Bash compatibility, archive cards, delete rollback sources, or mutate Git history.
- Explicit digest-bound user approval of this exact plan is required before implementation.

## Ordered tasks

### 1. Author the normative Trello agent development protocol

- Paths: `packages/trello-work-cli/assets/agent-workflow-protocol.md`
- Inputs: Acceptance criteria 1–6 and 9–10; lifecycle, authority, portability, evidence, completion, recovery, and archival decisions in `change-contract.md`; CLI and Superpowers evidence in `context.md`.
- Output: One normative protocol covering purpose and authority order; actors; Work Unit source of truth; lifecycle state table; intake and clarification; readiness; claim algorithm; progress/evidence updates; Superpowers handoffs; review and completion; blocking; minimal recovery; human archival; concurrency/idempotency; failure handling; harness-neutral requirements; and explicit safety/non-goals.
- Test command: `pnpm exec prettier --check packages/trello-work-cli/assets/agent-workflow-protocol.md`
- Expected result: Prettier exits `0`, and a manual transition trace confirms every canonical normal and recovery transition has preconditions, postconditions/read-back, evidence expectations, and an allowed next route without claiming atomic Trello behavior.
- Rollback: Not applicable.

### 2. Define the exact lightweight follow-on skill set in the protocol

- Paths: `packages/trello-work-cli/assets/agent-workflow-protocol.md`
- Inputs: Acceptance criteria 4–8; the user requirement to keep ceremony light; current cross-harness Superpowers support evidence; the rule that Trello owns durable state and Superpowers owns engineering practice.
- Output: A follow-on design for exactly four portable responsibilities:
  1. `trello-work-orchestrator` — read-only board/task discovery, resume, status interpretation, and routing to the earliest applicable lifecycle skill.
  2. `trello-work-design` — ordinary-card or Draft intake, same-card In Design conversion, clarification, canonical completeness, and guarded transition to Ready while delegating software-design practice to Superpowers when available.
  3. `trello-work-deliver` — recovery-aware claim, concise progress/evidence updates, Superpowers implementation/review/verification handoffs, Blocked routing, Review submission, and judgment-based completion to Done.
  4. `trello-work-recover` — exceptional ambiguous/partial outcome handling, replay recognition, reconcile-before-repair, conflicting-state stops, and safe return to the normal router.

  For each skill, the protocol states triggers, required inputs, permitted Trello mutations, outputs/postconditions, non-responsibilities, and the common harness-neutral core. It explicitly states that no agent skill owns manual Done-card archival and that adapters may change installation/bootstrap mechanics but not lifecycle authority.

- Test command: `git diff --check -- packages/trello-work-cli/assets/agent-workflow-protocol.md`
- Expected result: The command exits `0`; a responsibility trace shows every lifecycle action has one owning skill or the human, no skill duplicates Superpowers engineering methodology, and no hidden harness behavior is normative.
- Rollback: Not applicable.

### 3. Define the follow-on verification strategy and audit the protocol against live command documentation

- Paths: `packages/trello-work-cli/assets/agent-workflow-protocol.md`
- Inputs: Acceptance criteria 2–3 and 5–10; installed CLI documentation; package tests and packed-boundary evidence; current Superpowers harness documentation; known production-board and Git Bash boundaries.
- Output: A verification matrix for the future skill implementation covering Markdown/frontmatter structure, portable command vocabulary, offline/disposable lifecycle scenarios, claim sequencing, stale-version and operation replay, ambiguous and conflicting recovery, responsibility-boundary assertions, harness loading/adaptation for Claude Code/Codex/Pi/Hermes, zero production-board mutation, and optional allowlisted live validation only under separate authority.
- Test command: `cmd.exe /d /c "jz-trello-flow docs --topic safety"`
- Expected result: The installed version-matched safety documentation exits `0`; every normative mutation rule in the protocol maps to a documented `0.3.0` capability, and unsupported attachment upload, atomic claim, automatic archival, production-board migration, and native Hermes Superpowers assumptions are absent.
- Rollback: Not applicable.

### 4. Run repository documentation and workflow gates

- Paths: `packages/trello-work-cli/assets/agent-workflow-protocol.md`
- Inputs: All acceptance criteria and test seams from `change-contract.md`; completed outputs from tasks 1–3.
- Output: A formatter-clean, workflow-valid protocol snapshot ready for independent verification and later reconciliation, with failures preserved truthfully in the implementation report rather than silently substituted.
- Test command: `pnpm exec prettier --check packages/trello-work-cli/assets/agent-workflow-protocol.md && node scripts/validate-living-workflow.mjs && node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-trello-agent-workflow-protocol --json && git diff --check`
- Expected result: Every command exits `0`; the work-item validator still routes to the implementation stage until its implementation report is written; changed paths contain no skill implementation, package source/test change, release artifact, credential material, or Trello state artifact.
- Rollback: Not applicable.

## Affected paths

### Create

- `packages/trello-work-cli/assets/agent-workflow-protocol.md`

### Modify

- None during implementation. Pipeline-owned `NEXT.md` routing and later canonical-plan/NEXT reconciliation remain responsibilities of their respective pipeline stages, not protocol implementation.

### Delete

- None.

## Verification commands

1. `pnpm exec prettier --check packages/trello-work-cli/assets/agent-workflow-protocol.md`
   - Expected: exit `0`; protocol Markdown is formatter-clean.
2. `cmd.exe /d /c "jz-trello-flow docs --topic safety"`
   - Expected: exit `0`; installed `0.3.0` safety, concurrency, idempotency, and recovery documentation is available for claim-by-claim audit.
3. `cmd.exe /d /c "jz-trello-flow docs --topic workflows"`
   - Expected: exit `0`; installed recommended workflow guidance is available for lifecycle traceability.
4. `node scripts/validate-living-workflow.mjs`
   - Expected: exit `0`; living-plan structure remains valid.
5. `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-trello-agent-workflow-protocol --json`
   - Expected before the implementation report: valid state routed to `implement-monorepo-change`; expected after the implementation report is written by its owning stage: valid state routed to `verify-monorepo-change`.
6. `git diff --check`
   - Expected: exit `0`; no whitespace errors.
7. `git diff --name-only`
   - Expected: only the approved protocol path, current work-item artifacts, and pipeline-owned `NEXT.md`; later verification/reconciliation may add only their governed artifacts and current-truth planning paths.
8. Manual acceptance trace recorded in the implementation and verification evidence:
   - Expected: all ten acceptance criteria, all accepted design decisions, every canonical lifecycle/recovery route, all four proposed skills, and all four harnesses are covered; every detailed engineering-practice responsibility remains with Superpowers rather than being reimplemented.

## Rollback

Not applicable. The implementation creates one documentation file and no external or runtime state. If the plan is revised before approval or implementation, use the monorepo pipeline's plan-revision mechanism rather than editing approved bytes in place.
