# Monorepo Work-Item Pipeline Design

## Status

Approved design; implementation has not started.

## Purpose

Refine the AI Arsenal monorepo living-plan workflow into a durable, artifact-driven
pipeline. This workflow manages changes to the monorepo and its packages,
including `packages/features-cli`. It is separate from the consumer-project
`features-cli` workflow under `.scratch/features/`.

The design covers intake through verified implementation and reconciliation. It
does not cover release, packaging, publication, distribution, or global package
installation.

## Operating principles

- Every normal pipeline stage maps to one exact skill.
- Each skill declares its required input artifacts and produces known output
  artifacts for the next stage.
- The user can resume from the project root without remembering stage names,
  order, or state.
- A read-only router determines the earliest eligible next action. It does not
  write files, mutate Git state, or advance a work item.
- User approval is captured durably rather than inferred from chat history.
- The existing `AGENTS.md`, `NEXT.md`, canonical plan, and evidence remain the
  monorepo's authority while the workflow is migrated.

## Router

### Skill

`orchestrate-monorepo-work`

### Invocation

The user invokes it naturally from the repository root, for example:

```text
I would like to resume work. What must I do?
```

### Inputs

- Root and applicable scoped `AGENTS.md` files.
- `NEXT.md` and `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`.
- Git status and relevant commits.
- The active work item's artifacts, when one is registered.
- Relevant verification and reconciliation evidence.

### Output

A read-only routing brief in this form:

```text
Project:
Current work item:
Current pipeline step:
Next skill:
Required input:
Why this is next:
Approval/blockers:
Recommended command:
```

### Decision rules

1. Read the active work-item reference from `NEXT.md` and validate its artifacts
   in pipeline order.
2. Recommend the first unmet valid stage; never skip an artifact or approval
   gate.
3. If no active work item exists, report the current `NEXT.md` action. When the
   user supplies a new request, recommend `capture-monorepo-change`.
4. If approval is missing, explain the requested approval and recommend
   `record-monorepo-approval` only after the user explicitly grants it.
5. If verification fails while the contract remains valid, recommend
   `implement-monorepo-change` with the failed verification as input.
6. If workflow metadata is malformed, an artifact digest/revision is invalid, or
   more than one work item claims to be active, stop. Recommend the existing
   `initializing-living-plan-workflow` repair skill; never guess or repair state
   silently.

## Work-item artifacts

Each work item is stored at:

```text
docs/work-items/YYYY-MM-DD-<slug>/
```

Every artifact has a small header with:

- work-item ID;
- artifact type;
- revision;
- prerequisite artifact revisions; and
- status where applicable.

| Artifact                   | Responsibility                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `request.md`               | User intent, desired outcome, and supplied constraints.                                                           |
| `context.md`               | Applicable rules, repository snapshot, relevant files, known risks, and unanswered questions.                     |
| `change-contract.md`       | Goal, non-goals, hard boundaries, acceptance criteria, test seams, verification requirements, and approval needs. |
| `implementation-plan.md`   | Ordered executable tasks, affected areas, verification steps, and rollback considerations.                        |
| `approval.md`              | Explicit user approval and SHA-256 digest of the approved implementation plan.                                    |
| `implementation-report.md` | Changed paths, decisions, test changes, and known deviations.                                                     |
| `verification.md`          | Exact commands, exit codes, observed outcomes, and `passed` or `failed` status.                                   |
| `reconciliation.md`        | Resulting state, canonical-plan and `NEXT.md` changes, remaining risk, and next action.                           |

Changing a contract or plan increments its revision and invalidates downstream
approval, implementation, and verification artifacts. A new approval is then
required. Before replacing a current artifact, the writing skill copies its
previous revision to `revisions/<artifact-name>/v<N>.md` under the same work
item. Historical artifacts are therefore retained and never silently
overwritten.

## Normal skill pipeline

| Order | Skill                       | Required inputs                                  | Output                                                     | Production-file changes         |
| ----- | --------------------------- | ------------------------------------------------ | ---------------------------------------------------------- | ------------------------------- |
| 0     | `orchestrate-monorepo-work` | Repository state and artifacts                   | Routing brief                                              | No                              |
| 1     | `capture-monorepo-change`   | Explicit user request                            | `request.md` and active-work-item registration             | No                              |
| 2     | `orient-monorepo-change`    | `request.md`                                     | `context.md`                                               | No                              |
| 3     | `scope-monorepo-change`     | `request.md`, `context.md`                       | `change-contract.md`                                       | No                              |
| 4     | `plan-monorepo-change`      | `change-contract.md`                             | `implementation-plan.md`                                   | No                              |
| 5     | `record-monorepo-approval`  | Explicit user approval, `implementation-plan.md` | `approval.md`                                              | No                              |
| 6     | `implement-monorepo-change` | Contract, approved plan                          | Product/docs/test changes and `implementation-report.md`   | Yes                             |
| 7     | `verify-monorepo-change`    | Contract, plan, implementation report, worktree  | `verification.md`                                          | No, except isolated test output |
| 8     | `reconcile-monorepo-change` | Verification and active artifacts                | Updated canonical plan, `NEXT.md`, and `reconciliation.md` | Planning records only           |

The approval event is intentionally a separate skill so that the pipeline has a
durable, inspectable boundary between planning and implementation.

## Gates and recovery

- The router may recommend only the earliest unmet normal stage.
- `implement-monorepo-change` requires a valid plan digest in `approval.md`.
- `verify-monorepo-change` records failure evidence instead of claiming success.
- A valid contract plus failed verification re-enters the implementation stage.
- A needed scope or plan change invalidates downstream artifacts and requires a
  new approval before implementation resumes.
- Workflow corruption is a stop condition handled by
  `initializing-living-plan-workflow`, not by the router.

## Migration

- Preserve `initializing-living-plan-workflow` as the bootstrap and repair path.
- Decompose the broad normal-path responsibilities of
  `executing-living-plan-phase` into the narrow stages above.
- Refine `reconciling-living-plan` into `reconcile-monorepo-change` with the
  work-item artifacts as explicit inputs.
- Keep `AGENTS.md`, `NEXT.md`, the canonical plan, and evidence as the living
  workflow's authority; add the active work-item reference to `NEXT.md` during
  implementation.
- Do not force the already-pending CI confirmation into a newly created work
  item. The router reports it as the current `NEXT.md` action until it is
  resolved.
- New monorepo changes begin with `capture-monorepo-change`.

## Non-goals

- Replacing the consumer `.scratch/features/` and `features-cli` workflow.
- Using `features-cli` to manage work on `packages/features-cli`.
- Release automation, package publication, packing, global installation, or
  source retirement.
- Silently selecting among multiple active work items or bypassing approval.
