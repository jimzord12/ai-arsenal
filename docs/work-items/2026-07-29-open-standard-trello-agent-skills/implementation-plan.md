Work item: 2026-07-29-open-standard-trello-agent-skills
Artifact: plan
Revision: 1
Prerequisites: contract@1
Status: ready

# Preconditions

- Preserve all completed protocol changes and work-item evidence already present in the uncommitted worktree.
- Confirm the validator routes this work item to `implement-monorepo-change` only after digest-bound approval.
- Re-read `AGENTS.md`, the nearest applicable instructions, `packages/trello-work-cli/assets/agent-workflow-protocol.md`, installed CLI docs/help, and the official Agent Skills specification before authoring.
- Record the immutable official Agent Skills upstream revision used for `skills-ref` validation.
- Do not create skill files or the adapter guide until approval is recorded.
- Do not mutate a Trello board or require Trello credentials.

## Task 1 — Establish the portable skill skeletons

### Paths

- `.agents/skills/trello-work-orchestrator/SKILL.md`
- `.agents/skills/trello-work-design/SKILL.md`
- `.agents/skills/trello-work-deliver/SKILL.md`
- `.agents/skills/trello-work-recover/SKILL.md`

### Changes

- Create exactly four open-standard Agent Skill directories under the interoperable project-level `.agents/skills/` convention.
- Use only portable standard frontmatter needed by the skills: exact `name`, trigger-rich `description`, and an appropriate license declaration if repository licensing confirms it.
- Keep each `SKILL.md` within official recommended progressive-disclosure bounds and place activation-critical safety rules in the main file.
- Give each skill an overview, positive and negative triggers, required inputs, authority/non-responsibility boundary, ordered workflow with observable completion criteria, routing outcomes, common pitfalls, and verification checklist.
- Link the accepted protocol and version-matched CLI guide as repository-relative authority rather than copying the entire lifecycle or command catalog.
- Ensure descriptions are mutually distinguishable from catalog metadata alone.

### Proof

- Parse frontmatter and assert exact directory/name matching, required fields, standard constraints, line/token-oriented size bounds, and no harness-only required metadata.
- Confirm exactly four new `trello-work-*` skill directories exist.

## Task 2 — Implement read-only orchestration and bounded design

### Paths

- `.agents/skills/trello-work-orchestrator/SKILL.md`
- `.agents/skills/trello-work-design/SKILL.md`

### Changes

- Implement orchestration as a read-only current-state router for resume/status/selection/uncertain-lifecycle requests. It must use explicit board context, report one next skill/action, and perform no mutation.
- Implement design for ordinary Inbox selection, Draft Work Unit intake, same-card transition to In Design, canonical clarification, and guarded readiness transition.
- Keep engineering design methodology outside the Trello design skill; route to installed Superpowers brainstorming/planning or equivalent practices while retaining Trello state authority.
- Prevent the design skill from claiming, implementing, reviewing, completing, recovering exceptional mutations, or archiving.

### Proof

- Scenario matrix routes status/resume to orchestrator, ordinary Inbox and draft intake to design, unresolved material questions to continued In Design, and complete Work Units to Ready.
- Static checks find no mutation command in the orchestrator and no post-Ready normal transition in design.

## Task 3 — Implement normal delivery and exceptional recovery

### Paths

- `.agents/skills/trello-work-deliver/SKILL.md`
- `.agents/skills/trello-work-recover/SKILL.md`

### Changes

- Implement delivery for recovery-aware claiming, proportionate progress evidence, genuine blocking and resume/release, Review submission/disposition, and bounded agent completion through Done.
- Require owner update and `Ready → In Progress` as a multi-step claim, with both owner and status read back before engineering work starts; explicitly reject atomic-lock claims.
- Route software-design, implementation, TDD, debugging, code review, and verification methodology to Superpowers or equivalent harness practice.
- Implement recovery only for ambiguous/partial/stale/replayed/conflicting outcomes and drift: read first; recognize intended postcondition; retry unchanged state once with the same operation ID and latest version; never overwrite conflict blindly; use authorized reconciliation/repair or Blocked routing.
- Make Done terminal for agent lifecycle mutation and prohibit card archival or Done-list closure as a substitute.

### Proof

- Scenario matrix covers claim, progress update, Blocked/release/resume, Review submission, Review return, Done, ambiguous result, already-applied result, unchanged retry, stale/conflicting state, and reconciliation.
- Static assertions find the required owner/status postconditions, same-operation retry rule, conflict stop rule, bounded Done gate, and human archival boundary.

## Task 4 — Document canonical-source adaptation

### Path

- `packages/trello-work-cli/assets/agent-skills-adapters.md`

### Changes

- State that the four `.agents/skills/` directories are canonical open-standard sources and that `agent-workflow-protocol.md` is the lifecycle authority.
- Explain official project-level discovery, catalog/instruction/resource progressive disclosure, trust and collision considerations, and deterministic adapter provenance.
- Define allowed adapter differences: installation location, discovery/bootstrap, environment loading, tool invocation mapping, optional hooks, and optional Superpowers integration.
- Define prohibited adapter differences: lifecycle graph/authority changes, weakened board/version/operation/read-back rules, claimed atomic allocation, altered completion gates, automated archival, hidden-hook correctness dependencies, or invented native Superpowers support.
- Give bounded guidance for Claude Code, Codex, Pi, Hermes Agent, and generic Agent Skills clients without generating duplicate adapters.
- Require adapters to identify canonical source revision and document intentional mechanical transformations.

### Proof

- Content checks cover all four named harnesses, generic clients, allowed/prohibited differences, provenance, trust, collisions, progressive disclosure, and canonical authority.

## Task 5 — Validate the official open standard

### Temporary validation environment

- Use an isolated temporary directory outside the repository.
- Clone or fetch `agentskills/agentskills` at the recorded immutable upstream commit.
- Create a disposable Python environment for `skills-ref`; do not alter repository dependency manifests or lockfiles.

### Commands and checks

- Run `skills-ref validate` on each of the four skill directories.
- Run `skills-ref read-properties` on each directory and verify name, description, and location are usable as catalog data.
- Independently parse each `SKILL.md` to assert required frontmatter, exact name-parent match, description limits, no leading bytes before frontmatter, nonempty Markdown body, and bounded line count.
- Inspect all repository-relative references and assert every referenced path exists and does not form a deep reference chain.

### Proof

- Preserve exact tool revision, commands, exit codes, and zero-problem output in verification evidence.
- Remove the temporary environment after evidence capture without touching repository dependency state.

## Task 6 — Verify behavior, CLI accuracy, and safety

### Checks

- Build a deterministic matrix mapping the protocol's lifecycle and recovery scenarios to exactly one primary owning skill and permitted next routes.
- Audit literal CLI examples against installed `jz-trello-flow@0.3.0` help and the package command catalog.
- Assert orchestrator is read-only, design stops at Ready, deliver owns normal Ready-through-Done mutations, and recover is exceptional-only.
- Search for prohibited attachment-upload, atomic-lock, automatic-archive, production-board, hidden-hook, and false native-Superpowers claims.
- Confirm no credential values, board IDs, or production mutation evidence appears.
- Run Prettier over the five implementation Markdown files and `git diff --check`.

### Proof

- Every acceptance matrix row passes, command examples are supported, and prohibited semantic patterns are absent or appear only in explicit warnings.

## Task 7 — Fresh-agent review and fix loop

### Review scope

- All four `SKILL.md` files.
- `packages/trello-work-cli/assets/agent-skills-adapters.md`.
- The accepted protocol sections 2, 4–17 and official Agent Skills specification/client guidance.

### Review dimensions

- Lifecycle authority and transition ownership.
- Claim concurrency and idempotency truthfulness.
- Exceptional recovery correctness.
- Completion and human archival boundary.
- Trigger overlap and premature completion.
- Portability, progressive disclosure, trust, and adapter derivation.
- CLI command accuracy and accidental production-mutation risk.

### Exit condition

- Fix all Critical, High, and Medium findings that are within contract.
- Re-run affected checks and obtain a fresh review with only minor or no findings.
- Do not broaden scope to generated adapters, package integration, release, installation, or live Trello testing.

## Task 8 — Record implementation and independent verification

### Work-item artifacts

- `docs/work-items/2026-07-29-open-standard-trello-agent-skills/implementation-report.md`
- `docs/work-items/2026-07-29-open-standard-trello-agent-skills/verification.md`

### Changes

- Record only implementation-mutated paths; distinguish pre-existing protocol work and work-item artifacts.
- Record official-spec revision and validation output, frontmatter/reference checks, lifecycle matrix, CLI audit, safety audit, formatting, fresh-agent review, and fixes.
- Advance only through validator-confirmed pipeline stages.

### Final commands

- `pnpm exec prettier --check .agents/skills/trello-work-orchestrator/SKILL.md .agents/skills/trello-work-design/SKILL.md .agents/skills/trello-work-deliver/SKILL.md .agents/skills/trello-work-recover/SKILL.md packages/trello-work-cli/assets/agent-skills-adapters.md`
- Official `skills-ref validate` and `read-properties` for each canonical skill from the isolated pinned environment.
- Deterministic frontmatter/reference/lifecycle/authority/CLI/safety matrix.
- `node scripts/validate-monorepo-work-item.mjs --current --json`
- `node scripts/validate-living-workflow.mjs` when reconciliation changes planning records.
- `git diff --check`

## Task 9 — Reconcile current truth

### Paths

- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `NEXT.md`
- `docs/work-items/2026-07-29-open-standard-trello-agent-skills/reconciliation.md`

### Changes

- After passed independent verification, record resulting canonical skill locations, verified standard revision, responsibility boundaries, adapter status, and residual risks.
- Clear the active work item and set one exact next action derived from remaining approved scope.
- Preserve explicit future gates for package/docs integration, generated adapters, release, installation, live/production Trello mutation, Git Bash remediation, archival automation, source deletion, commit, and push.

### Proof

- Work-item validator reports completion, living-workflow validation passes, formatting passes, and `git diff --check` is clean.

## Rollback

- Remove only the four new `.agents/skills/trello-work-*` directories and `packages/trello-work-cli/assets/agent-skills-adapters.md` if implementation must be abandoned before commit.
- Restore only current-work-item planning/artifact changes through repository history or preserved revisions; do not remove the previously completed protocol source or its work-item evidence.
- No Trello rollback is required because this plan performs no Trello mutation.

## Risks and mitigations

- **Trigger overlap:** make catalog descriptions scenario-specific and verify exclusive primary routing.
- **Rule drift:** link the package-owned protocol and minimize copied command/lifecycle detail.
- **Harness coupling:** use standard frontmatter and generic capabilities; isolate harness notes in the adapter guide.
- **False atomicity:** require owner/status read-back and state explicitly that claiming is recovery-aware, not locked.
- **Recovery overuse:** activate recovery only after uncertainty and keep successful routine paths ceremony-light.
- **Stale command syntax:** audit any literal examples against installed `0.3.0`; prefer semantic steps plus version-matched guide references.
- **Reference validator dependency:** run official `skills-ref` in a disposable pinned environment outside repository dependency state.
- **Dirty-work attribution:** record pre-existing protocol paths before implementation and report only newly changed implementation paths.
- **Premature distribution:** keep package manifest, offline docs, generated adapters, release, publication, and installation out of scope.

## Completion criteria

- All twelve contract acceptance criteria pass.
- The four canonical Agent Skills and adapter guide are implemented within approved paths only.
- Official pinned `skills-ref` validation reports no problems.
- Deterministic lifecycle, authority, command, safety, and adaptation matrices pass.
- Fresh-agent review has no unresolved Critical, High, or Medium issue.
- No production Trello mutation, credential exposure, package-boundary change, generated harness adapter, release, installation, archival automation, commit, or push occurred.
- Verification and reconciliation artifacts are passed and validators report the work item complete.
