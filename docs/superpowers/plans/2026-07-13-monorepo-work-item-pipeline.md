# Monorepo Work-Item Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the monorepo living-plan workflow into a read-only routed,
artifact-driven pipeline that takes a monorepo change from user request through
verified implementation and reconciliation.

**Architecture:** A single shared work-item contract defines durable artifacts
under `docs/work-items/`. Nine narrow repository skills consume and produce
those artifacts. A Node validator enforces artifact headers, prerequisite
revisions, plan-approval digests, and active-work-item rules; the router reads
that validation state without mutating the repository.

**Tech Stack:** Markdown skill packages, Node.js 24 standard library, existing
`scripts/validate-living-workflow.mjs`, pnpm, Prettier, Git, and the existing
living-plan documents.

## Global Constraints

- Preserve the separate consumer `.scratch/features/` workflow and never use
  `features-cli` to manage work on `packages/features-cli`.
- The normal pipeline ends after reconciliation. Releases, packing, publishing,
  global installation, and source deletion stay outside it.
- The router is read-only: it must not write files, mutate Git state, or advance
  a work item.
- Every normal stage has one exact skill, explicit prerequisite artifacts, and
  deterministic outputs.
- Store work items at `docs/work-items/YYYY-MM-DD-<slug>/`; retain prior
  artifact versions at `revisions/<artifact-name>/v<N>.md` before replacement.
- Use an explicit `approval.md` containing a SHA-256 digest of the approved
  `implementation-plan.md`; implementation must reject missing or stale
  approval.
- Keep `AGENTS.md`, `NEXT.md`, the canonical plan, and `docs/evidence/` as the
  repository authority while migrating.
- Each skill-writing task receives a fresh sub-agent. Do not let parallel agents
  edit shared files.
- Do not commit or push without the user’s explicit direction.

---

## File Structure

| Path                                             | Responsibility                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`   | Normative stage order, artifact header schema, status values, invalidation, and router decision table.         |
| `docs/workflow/templates/work-item/*.md`         | One Markdown template for every durable work-item artifact.                                                    |
| `scripts/validate-monorepo-work-item.mjs`        | Validates one selected work item, emits machine-readable JSON, and exits nonzero for invalid state.            |
| `scripts/validate-monorepo-work-item.test.mjs`   | Node built-in test fixtures for valid, missing, stale, failed-verification, and conflicting-active-item cases. |
| `scripts/validate-living-workflow.mjs`           | Requires the new workflow guide and all normal-path skill packages.                                            |
| `package.json`                                   | Adds root workflow test and validation scripts; `check` includes them.                                         |
| `.agents/skills/<skill-name>/SKILL.md`           | Exact input, output, mutation permissions, validation command, and stop conditions for one stage.              |
| `.agents/skills/<skill-name>/agents/openai.yaml` | Existing repository skill metadata pattern for the corresponding stage.                                        |
| `AGENTS.md`                                      | Replaces the broad normal execution rule with the new pipeline and self-hosting boundary.                      |
| `NEXT.md`                                        | Adds active-work-item fields while retaining the 30-second operator shape.                                     |
| `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` | Reconciles current workflow truth and the migration completion state.                                          |
| `docs/workflow/WORKFLOW_OVERVIEW.md`             | Gives humans the short routed-pipeline explanation and resume prompt.                                          |

## Shared Interfaces

All artifact files begin with this exact header; values are plain text on one
line and `Prerequisites` is a comma-separated `name@revision` list or `none`:

```markdown
Work item: <YYYY-MM-DD-slug>
Artifact: <request|context|contract|plan|approval|implementation|verification|reconciliation>
Revision: <positive integer>
Prerequisites: <none|artifact@revision,...>
Status: <draft|ready|approved|passed|failed|superseded>
```

The active-work-item block in `NEXT.md` is exactly:

```markdown
**Active work item:** `<YYYY-MM-DD-slug>`
**Pipeline step:** `<skill-name|none>`
```

`approval.md` additionally contains exactly these fields beneath its header:

```markdown
Approved plan SHA-256: `<64 lowercase hexadecimal characters>`
Approved by: `user`
Approval source: `<verbatim user approval summary>`
```

`scripts/validate-monorepo-work-item.mjs` accepts:

```text
node scripts/validate-monorepo-work-item.mjs --work-item <YYYY-MM-DD-slug>
node scripts/validate-monorepo-work-item.mjs --work-item <YYYY-MM-DD-slug> --json
```

Its JSON contract is:

```json
{
  "workItem": "2026-07-13-example",
  "valid": true,
  "nextSkill": "orient-monorepo-change",
  "blocker": null,
  "artifacts": {
    "request": { "revision": 1, "status": "ready" }
  }
}
```

For invalid state it must emit the same object with `valid: false`,
`nextSkill: null`, a nonempty `blocker`, and exit `1`. It never writes files.

## Sub-Agent Schedule

- Wave 0: the main agent completes Task 1 because it creates shared contracts.
- Wave 1: dispatch one fresh sub-agent each for Tasks 2, 3, and 4.
- Wave 2: dispatch one fresh sub-agent each for Tasks 5, 6, and 7.
- Wave 3: dispatch one fresh sub-agent each for Tasks 8, 9, and 10.
- Wave 4: the main agent completes Tasks 11 and 12, then dispatches independent
  reviewers for Task 13. Assign repairs only to the sub-agent responsible for
  the rejected task, then rerun the integrated review.

Each sub-agent must edit only the files named in its task, run the named focused
checks, report the diff and commands used, and make no commit.

### Task 1: Create the Shared Work-Item Contract and Validator

**Files:**

- Create: `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- Create: `docs/workflow/templates/work-item/request.md`
- Create: `docs/workflow/templates/work-item/context.md`
- Create: `docs/workflow/templates/work-item/change-contract.md`
- Create: `docs/workflow/templates/work-item/implementation-plan.md`
- Create: `docs/workflow/templates/work-item/approval.md`
- Create: `docs/workflow/templates/work-item/implementation-report.md`
- Create: `docs/workflow/templates/work-item/verification.md`
- Create: `docs/workflow/templates/work-item/reconciliation.md`
- Create: `scripts/validate-monorepo-work-item.mjs`
- Create: `scripts/validate-monorepo-work-item.test.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: the approved design at
  `docs/superpowers/specs/2026-07-13-monorepo-work-item-pipeline-design.md`.
- Produces: the exact artifact/header/JSON contracts used by every subsequent
  skill task.

- [ ] **Step 1: Write failing Node tests for the validator.**

  Create disposable work-item directories in `node:test` using
  `fs.mkdtempSync(path.join(os.tmpdir(), 'ai-arsenal-work-item-'))`. Cover:

  - a ready `request.md` routes to `orient-monorepo-change`;
  - a ready request and context route to `scope-monorepo-change`;
  - a plan with no approval blocks with `nextSkill: null` and a human-approval
    blocker;
  - an approval whose digest differs from the plan exits `1` with
    `nextSkill: null`;
  - a failed verification after a valid implementation routes to
    `implement-monorepo-change`;
  - an active-work-item conflict exits `1` with a nonempty blocker.

  Use the validator as a child process so tests assert the public CLI JSON and
  exit code rather than internal helpers.

- [ ] **Step 2: Run the focused test and verify it fails because the validator is absent.**

  Run:

  ```powershell
  node --test scripts/validate-monorepo-work-item.test.mjs
  ```

  Expected: failure identifying the missing validator module or command.

- [ ] **Step 3: Write the normative guide and templates.**

  The guide must define all eight artifact types, the header above, current
  artifact paths, archival paths, revision invalidation, exact allowed statuses,
  stage prerequisites, `NEXT.md` active fields, approval digest calculation,
  failed-verification re-entry, and structural-corruption stop conditions.

  Each template must contain the standard header plus these required sections:

  | Template                   | Required sections                                                                             |
  | -------------------------- | --------------------------------------------------------------------------------------------- |
  | `request.md`               | Request, Desired outcome, Constraints, User-provided context                                  |
  | `context.md`               | Applicable instructions, Repository snapshot, Relevant files, Risks, Open questions           |
  | `change-contract.md`       | Goal, Non-goals, Hard walls, Acceptance criteria, Test seams, Verification, Approval required |
  | `implementation-plan.md`   | Preconditions, Ordered tasks, Affected paths, Verification commands, Rollback                 |
  | `approval.md`              | Approved plan SHA-256, Approved by, Approval source                                           |
  | `implementation-report.md` | Changed paths, Decisions, Tests, Deviations                                                   |
  | `verification.md`          | Commands, Exit codes, Observed result, Status, Remaining failures                             |
  | `reconciliation.md`        | Resulting state, Canonical-plan updates, NEXT.md update, Risks, Next action                   |

- [ ] **Step 4: Implement the validator with Node built-ins only.**

  Implement argument parsing for `--work-item` and `--json`, reject unknown
  arguments, and resolve only under `docs/work-items/`. Read only current
  artifact names, parse their headers with anchored line regexes, verify every
  declared prerequisite revision, calculate `crypto.createHash('sha256')` over
  the exact UTF-8 plan bytes, and emit the JSON interface above.

  Implement the ordered routing table:

  ```text
  no request                    -> capture-monorepo-change
  request only                  -> orient-monorepo-change
  request + context             -> scope-monorepo-change
  contract only                 -> plan-monorepo-change
  plan without valid approval   -> blocked: explicit user approval required
  valid approval, no report     -> implement-monorepo-change
  report, no verification       -> verify-monorepo-change
  verification failed           -> implement-monorepo-change
  verification passed           -> reconcile-monorepo-change
  reconciliation passed         -> no next skill; work item complete
  ```

  Treat inconsistent headers, stale approvals, duplicate active references, and
  illegal status transitions as invalid structural state, not a forward stage.

- [ ] **Step 5: Add root scripts.**

  Add these exact `package.json` scripts:

  ```json
  "test:workflow": "node --test scripts/validate-monorepo-work-item.test.mjs",
  "validate:workflow": "node scripts/validate-living-workflow.mjs && node scripts/validate-monorepo-work-item.mjs --work-item none --json"
  ```

  Make `validate:workflow` accept `--work-item none` as a valid no-active-item
  state that returns JSON with `valid: true`, `nextSkill: null`, and
  `blocker: "No active work item."`. Append `&& pnpm test:workflow && pnpm
validate:workflow` to the existing `check` script.

- [ ] **Step 6: Run focused verification.**

  Run:

  ```powershell
  node --test scripts/validate-monorepo-work-item.test.mjs
  pnpm validate:workflow
  ```

  Expected: all Node tests pass; both validators exit `0`.

### Task 2: Write `orchestrate-monorepo-work`

**Files:**

- Create: `.agents/skills/orchestrate-monorepo-work/SKILL.md`
- Create: `.agents/skills/orchestrate-monorepo-work/agents/openai.yaml`

**Interfaces:**

- Consumes: Task 1 guide, `NEXT.md`, scoped instructions, Git state, and
  validator JSON.
- Produces: the eight-field routing brief only; no filesystem output.

- [ ] **Step 1: Write the skill with `Use when` frontmatter and explicit read-only rule.**

  Require reading root/scoped `AGENTS.md`, `NEXT.md`, the canonical plan section
  named by `NEXT.md`, `git status --short`, recent commits, and validator JSON.
  Require `node scripts/validate-monorepo-work-item.mjs --work-item <id> --json`
  when an active work item exists.

- [ ] **Step 2: Implement the routing brief contract.**

  Require exactly these fields: Project, Current work item, Current pipeline
  step, Next skill, Required input, Why this is next, Approval/blockers, and
  Recommended command. For no active item, report the current `NEXT.md` action
  and recommend `capture-monorepo-change` only after the user describes a new
  change.

- [ ] **Step 3: Add stop conditions and metadata.**

  For validator-invalid state, multiple active work items, stale approval, or
  malformed workflow metadata, require a stopped report that recommends
  `initializing-living-plan-workflow`; never select a normal next skill.
  Copy the existing `agents/openai.yaml` schema with a router-specific display
  name, concise description, and `allow_implicit_invocation: true`.

- [ ] **Step 4: Run the focused checks.**

  Run:

  ```powershell
  node scripts/validate-monorepo-work-item.mjs --work-item none --json
  pnpm format:check
  ```

  Expected: valid no-active JSON and no formatting violations.

### Task 3: Write `capture-monorepo-change`

**Files:**

- Create: `.agents/skills/capture-monorepo-change/SKILL.md`
- Create: `.agents/skills/capture-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: an explicit user request, no active work item, and the request
  template from Task 1.
- Produces: `docs/work-items/<id>/request.md` at revision `1` and `NEXT.md`
  active-work-item fields set to `<id>` / `orient-monorepo-change`.

- [ ] **Step 1: Require collision-free ID selection.**

  The skill derives `<id>` as `YYYY-MM-DD-<lowercase-kebab-slug>` from the
  request, verifies the target directory does not exist, and stops for user
  direction if it does. It must not overwrite an existing work item.

- [ ] **Step 2: Require exact request contents.**

  Fill every request-template section from user-provided facts. Record unknown
  details as questions; do not invent constraints or acceptance criteria.

- [ ] **Step 3: Require active registration and validation.**

  Update only the two active-work-item fields in `NEXT.md` without changing its
  required headings. Then run:

  ```powershell
  node scripts/validate-monorepo-work-item.mjs --work-item <id> --json
  ```

  Expected: `valid: true` and `nextSkill: "orient-monorepo-change"`.

### Task 4: Write `orient-monorepo-change`

**Files:**

- Create: `.agents/skills/orient-monorepo-change/SKILL.md`
- Create: `.agents/skills/orient-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: ready `request.md`, active `NEXT.md`, applicable instructions, Git
  state, and source/docs relevant to the request.
- Produces: `context.md` revision `1` with prerequisite `request@1` and status
  `ready`.

- [ ] **Step 1: Require repository evidence gathering.**

  Read the nearest applicable instructions before inspecting source. Record
  branch/commit, `git status --short`, relevant package/docs paths, existing
  commands/tests, risks, and unresolved questions in the context template.

- [ ] **Step 2: Prevent scope and implementation.**

  Prohibit source edits, plan writing, acceptance-criteria creation, and
  release actions. If the request is ambiguous enough to prevent reliable
  context, report the exact question and stop.

- [ ] **Step 3: Validate the handoff.**

  Run the validator and require `nextSkill: "scope-monorepo-change"`.

### Task 5: Write `scope-monorepo-change`

**Files:**

- Create: `.agents/skills/scope-monorepo-change/SKILL.md`
- Create: `.agents/skills/scope-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: ready `request.md` and `context.md` with matching work-item ID.
- Produces: `change-contract.md` revision `1`, prerequisites `request@1,
context@1`, status `ready`.

- [ ] **Step 1: Require a complete contract.**

  Fill the contract template with one goal, explicit non-goals, hard walls,
  acceptance criteria, observable test seams, exact verification categories,
  and whether implementation approval is required. Preserve user-locked
  constraints verbatim.

- [ ] **Step 2: Enforce approval boundaries.**

  Stop and ask the user before a contract would change public behavior, schema,
  major dependency, material operational cost, distribution direction, source
  deletion, or user data. Record the unanswered decision in the contract rather
  than proceeding.

- [ ] **Step 3: Validate the handoff.**

  Run the validator and require `nextSkill: "plan-monorepo-change"`.

### Task 6: Write `plan-monorepo-change`

**Files:**

- Create: `.agents/skills/plan-monorepo-change/SKILL.md`
- Create: `.agents/skills/plan-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: ready `change-contract.md` and its acceptance/test-seam sections.
- Produces: `implementation-plan.md` revision `1`, prerequisite `contract@1`,
  status `ready`.

- [ ] **Step 1: Require executable plan entries.**

  Every plan entry names exact paths, inputs, outputs, test command, expected
  result, and a rollback note when a stateful change is involved. The plan must
  not add requirements outside the contract.

- [ ] **Step 2: Require pre-implementation review.**

  End the skill by presenting the plan to the user for approval. It must not
  create `approval.md`, edit production files, or treat silence as approval.

- [ ] **Step 3: Validate the blocked state.**

  Run the validator and require `valid: true`, `nextSkill: null`, and an
  explicit-approval blocker.

### Task 7: Write `record-monorepo-approval`

**Files:**

- Create: `.agents/skills/record-monorepo-approval/SKILL.md`
- Create: `.agents/skills/record-monorepo-approval/agents/openai.yaml`

**Interfaces:**

- Consumes: explicit user approval in the current conversation and a ready
  `implementation-plan.md`.
- Produces: `approval.md` revision `1`, prerequisite `plan@1`, status
  `approved`, with SHA-256 of the exact current plan bytes.

- [ ] **Step 1: Reject implied approval.**

  The skill may run only after a direct user approval. A request for a summary,
  a question, or lack of objection is not approval.

- [ ] **Step 2: Record and verify the digest.**

  Calculate the digest with Node or PowerShell over the exact UTF-8 plan file,
  write the three approval fields from the shared interface, then run the
  validator.

- [ ] **Step 3: Require the implementation route.**

  Expected validator JSON: `valid: true` and
  `nextSkill: "implement-monorepo-change"`.

### Task 8: Write `implement-monorepo-change`

**Files:**

- Create: `.agents/skills/implement-monorepo-change/SKILL.md`
- Create: `.agents/skills/implement-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: contract, approved plan whose digest matches `approval.md`, and the
  current worktree.
- Produces: allowed source/docs/test changes and `implementation-report.md`
  with prerequisites `contract@1, plan@1, approval@1`, status `ready`.

- [ ] **Step 1: Enforce the approval and contract cage.**

  Run the validator before edits. Refuse to work on a stale digest, missing
  approval, invalid workflow state, or task outside the contract. Read scoped
  instructions before every affected path; `packages/features-cli/AGENTS.md`
  prohibits invoking `features-cli` for package self-maintenance.

- [ ] **Step 2: Require test-first execution for behavior changes.**

  For each behavior change: write a focused failing test, run it and observe the
  intended failure, implement the smallest conforming change, and rerun the
  focused test. Documentation-only changes still require applicable formatter
  and workflow validation.

- [ ] **Step 3: Write the implementation report.**

  List each changed path, decision, test added or changed, verification already
  run, and any contract deviation. A deviation is a stop condition, not an
  undocumented expansion.

- [ ] **Step 4: Validate the handoff.**

  Run the validator and require `nextSkill: "verify-monorepo-change"`.

### Task 9: Write `verify-monorepo-change`

**Files:**

- Create: `.agents/skills/verify-monorepo-change/SKILL.md`
- Create: `.agents/skills/verify-monorepo-change/agents/openai.yaml`

**Interfaces:**

- Consumes: contract, plan, implementation report, changed worktree, and the
  contract's stated verification requirements.
- Produces: `verification.md` with prerequisites `contract@1, plan@1,
implementation@1` and status `passed` or `failed`.

- [ ] **Step 1: Build the verification matrix from the contract.**

  Map every acceptance criterion to one exact command or manual observation.
  Include changed-file checks, focused tests, relevant package/root checks,
  `git diff --check`, and `node scripts/validate-living-workflow.mjs` when the
  workflow artifacts changed.

- [ ] **Step 2: Record observed evidence, never intent.**

  Record commands, exit codes, concise output, criterion mapping, and remaining
  failures. On any failed required check, set `Status: failed`, do not update
  `NEXT.md` or the canonical plan, and require router re-entry at
  `implement-monorepo-change`.

- [ ] **Step 3: Validate the route.**

  Require `nextSkill: "reconcile-monorepo-change"` only for passed evidence;
  require `nextSkill: "implement-monorepo-change"` for failed evidence.

### Task 10: Write `reconcile-monorepo-change`

**Files:**

- Create: `.agents/skills/reconcile-monorepo-change/SKILL.md`
- Create: `.agents/skills/reconcile-monorepo-change/agents/openai.yaml`
- Create: `.agents/skills/reconcile-monorepo-change/references/reconciliation-contract.md`

**Interfaces:**

- Consumes: passed verification and every current active artifact.
- Produces: `reconciliation.md` status `passed`, updated canonical plan,
  `NEXT.md`, and active-work-item completion state.

- [ ] **Step 1: Preserve reconciliation discipline.**

  Port the existing reconciliation contract's current-truth, risk, decision,
  evidence, and 30-second `NEXT.md` requirements. Add the explicit condition
  that verification must be `passed`; failed verification is never
  reconcilable as complete.

- [ ] **Step 2: Close the work item deterministically.**

  Update the active fields in `NEXT.md` to `none` / `none` only after writing
  passed reconciliation evidence. Preserve the next action derived from the
  canonical plan; do not manufacture a new work item.

- [ ] **Step 3: Validate the completed state.**

  Run the validator and require `valid: true` with `nextSkill: null` and a
  completion status. Run `node scripts/validate-living-workflow.mjs`.

### Task 11: Integrate Governance, Documentation, and Existing Skills

**Files:**

- Modify: `AGENTS.md`
- Modify: `NEXT.md`
- Modify: `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- Modify: `docs/workflow/WORKFLOW_OVERVIEW.md`
- Modify: `scripts/validate-living-workflow.mjs`
- Modify: `.agents/skills/initializing-living-plan-workflow/SKILL.md`
- Modify: `.agents/skills/executing-living-plan-phase/SKILL.md`
- Modify: `.agents/skills/reconciling-living-plan/SKILL.md`

**Interfaces:**

- Consumes: all Task 1–10 skill files and their declared interfaces.
- Produces: one internally consistent repository workflow with the router as
  the resume entry point.

- [ ] **Step 1: Update the root operating contract.**

  Replace the normal-path `Orient → execute one phase → verify → reconcile`
  loop with the exact router and stage sequence. Keep
  `initializing-living-plan-workflow` as bootstrap/repair only. State that
  `executing-living-plan-phase` is a compatibility wrapper which must route to
  `orchestrate-monorepo-work` rather than perform broad execution.

- [ ] **Step 2: Update current-state documents without inventing a work item.**

  Add the `NEXT.md` active fields with `none` / `none`; retain the existing CI
  confirmation as the exact next action. Reconcile the canonical plan to name
  the new workflow and record that it does not alter the consumer `.scratch`
  pipeline.

- [ ] **Step 3: Update the existing skills.**

  `initializing-living-plan-workflow` must repair work-item metadata when the
  router reports structural corruption. `executing-living-plan-phase` must
  cease being the normal executor and tell callers to invoke the router.
  `reconciling-living-plan` must redirect normal completed work items to
  `reconcile-monorepo-change` while retaining use for legacy plan repair.

- [ ] **Step 4: Extend the workflow validator.**

  Require the guide and all nine normal skill `SKILL.md` files. Validate their
  YAML frontmatter names and descriptions, require the `NEXT.md` active fields,
  and verify the root instructions name `orchestrate-monorepo-work` plus all
  eight write-capable skills.

- [ ] **Step 5: Run integration checks.**

  Run:

  ```powershell
  pnpm test:workflow
  pnpm validate:workflow
  pnpm format:check
  git diff --check
  ```

  Expected: all commands exit `0`.

### Task 12: Execute an End-to-End Disposable Work-Item Simulation

**Files:**

- Modify: `scripts/validate-monorepo-work-item.test.mjs`
- Modify: `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`

**Interfaces:**

- Consumes: the complete integrated pipeline.
- Produces: one test that proves normal routing transitions and the
  failed-verification loop without touching real `docs/work-items/` data.

- [ ] **Step 1: Add the complete lifecycle fixture.**

  In a temporary root, create revisions in this order: request, context,
  contract, plan, approval with matching digest, implementation report,
  verification passed, reconciliation passed. Invoke the validator after each
  addition and assert its `nextSkill` follows the exact stage sequence.

- [ ] **Step 2: Add the failed-verification branch.**

  Replace only the verification artifact with `Status: failed`; assert the
  validator returns `implement-monorepo-change`, then restore passed evidence
  and assert reconciliation routing resumes.

- [ ] **Step 3: Run the complete root quality command.**

  Run:

  ```powershell
  pnpm check
  ```

  Expected: formatting, linting, typechecking, package tests, workflow tests,
  and both validators pass.

### Task 13: Wide Integration Review and Targeted Repair

**Files:**

- Review: every file changed by Tasks 1–12.
- Modify only when a reviewer identifies a concrete defect or contract mismatch.

**Interfaces:**

- Consumes: the approved design, implementation plan, complete diff, test
  results, and all skills/artifacts.
- Produces: an integration review report and, if needed, targeted corrective
  changes with fresh verification.

- [ ] **Step 1: Dispatch three independent read-only reviewers.**

  Assign these non-overlapping review lenses:

  1. **Pipeline contract reviewer:** artifact schemas, revisions, approval
     invalidation, router order, failed-verification loop, and no-active-item
     behavior.
  2. **Skill-operability reviewer:** every `SKILL.md` has one purpose, exact
     input/output, real commands, stop conditions, scoped instruction handling,
     and no self-hosting leak to `features-cli`.
  3. **Repository-integration reviewer:** `AGENTS.md`, `NEXT.md`, canonical
     plan, validator, package scripts, documentation, and existing skills agree
     with the approved design.

- [ ] **Step 2: Triage every finding against the approved design.**

  Reject non-actionable style opinions. For each real defect, identify the
  owning task and send only that defect to a fresh repair sub-agent with the
  relevant contract and a required focused verification command.

- [ ] **Step 3: Re-run complete verification after all repairs.**

  Run:

  ```powershell
  pnpm check
  pnpm validate:workflow
  git diff --check
  git status --short
  ```

  Expected: all validation commands exit `0`; the final status contains only
  intentional work-item-pipeline changes and any separately approved preflight
  documents.

- [ ] **Step 4: Hand off for user review.**

  Report the finalized router command, the nine skill names, every verification
  command and result, review findings/fixes, current `NEXT.md` action, and any
  approval needed for commit or push.

## Plan Self-Review

- Design coverage: Tasks 1–10 implement the router, all eight write-capable
  skills, durable artifacts, approval digest, invalidation, failed-verification
  loop, repair routing, and the existing-skill migration. Tasks 11–13 cover
  integration, full lifecycle simulation, and the requested wide review/fixes.
- Placeholder scan: no deferred implementation marker or unspecified stage is
  present; every skill has paths, inputs, outputs, and checks.
- Interface consistency: all tasks use the shared artifact names, header fields,
  `NEXT.md` fields, and validator `nextSkill` names defined above.
