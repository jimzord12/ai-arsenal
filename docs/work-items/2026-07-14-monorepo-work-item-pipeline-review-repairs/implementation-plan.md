Work item: 2026-07-14-monorepo-work-item-pipeline-review-repairs
Artifact: plan
Revision: 2
Prerequisites: contract@2
Status: ready

# Preconditions

- `change-contract.md` is the ready revision-2 contract for this active work
  item, with `request@1,context@1` prerequisites.
- The user approved the revision-request design in
  `docs/superpowers/specs/2026-07-14-monorepo-revision-request-design.md` but
  must explicitly approve this exact revision-2 plan before implementation.
- All work-item lifecycle tests use disposable temporary roots. This work does
  not invoke `features-cli`, read or write consumer `.scratch` state, perform
  release or distribution work, change public behavior or persisted schemas,
  delete sources or user data, or commit or push.
- Existing unrelated dirty files and prior Task 13 evidence remain preserved.

## Ordered tasks

### 1. Specify revision-request and active-registration behavior with disposable validator tests

- Paths: `scripts/validate-monorepo-work-item.test.mjs`
- Inputs: Acceptance criteria 1–3 and 5; the active-registration and
  revision-request test seams; the revision-request design.
- Output: Focused child-process fixture coverage for explicit inactive and
  active `--current` routing, malformed or conflicting registration, valid
  contract and plan revision requests, malformed or duplicate request fields,
  stale or unsupported target prerequisites, and the two archive/increment
  lifecycle routes.
- Test command: `node --test scripts/validate-monorepo-work-item.test.mjs`
- Expected result: Before implementation, the new request-routing and
  request-validation assertions fail for the missing validator behavior; after
  Task 2, every focused test exits `0` and proves the expected JSON route and
  archive identity.
- Rollback: Not applicable.

### 2. Implement validator-backed current registration and revision-request routing

- Paths: `scripts/validate-monorepo-work-item.mjs`, `package.json`
- Inputs: Acceptance criteria 1, 3, 5, and 8; the focused tests from Task 1;
  the existing artifact parser, archive validator, active-route validator, and
  `validate:workflow` script.
- Output: A strict `--current` validation path; rejection of missing, partial,
  duplicate, malformed, and inconsistent active registration; and a validated
  `revision-request.md` artifact whose body has exactly one `Revision target:`
  field with `contract` or `plan` as its backticked value and exactly one
  nonempty `Revision source:` field. A current request must reference the
  current target revision and routes only to `scope-monorepo-change` for a
  contract target or `plan-monorepo-change` for a plan target. Archived request
  revisions use the existing `revisions/revision-request.md/v<N>.md` identity
  and `superseded` preservation rules. The root workflow validation command
  remains bound to `--current`.
- Test command: `node --test scripts/validate-monorepo-work-item.test.mjs`
- Expected result: Every focused validator test exits `0`; invalid request or
  registration state exits `1` with a nonempty JSON blocker; a valid current
  request returns only its owning stage.
- Rollback: Not applicable.

### 3. Extend workflow structure tests before enforcing the new lifecycle contract

- Paths: `scripts/validate-living-workflow.test.mjs`, `scripts/validate-living-workflow.mjs`
- Inputs: Acceptance criteria 3, 4, 6, and 7; workflow-skill structure test
  seam; the existing required-skill and root-command fixture checks.
- Output: A red-to-green disposable fixture specification that requires the
  revision-request skill and its frontmatter identity, the root
  `validate:workflow` command to use `--current`, router wording that limits
  revision entry to direct user intent, and scope/plan recovery wording that
  names the request artifact, reverse downstream archival, archive-plus-
  increment replacement, and their exact target routes. The living-workflow
  validator enforces those structural rules for the repository.
- Test command: `node --test scripts/validate-living-workflow.test.mjs`
- Expected result: The new fixture assertions initially fail against the
  missing workflow contract, then all structural tests exit `0` after Tasks 4
  and 5; a fixture missing any required recovery rule exits `1` with an
  identifying error.
- Rollback: Not applicable.

### 4. Add the narrow revision-request stage and route only direct user intent to it

- Paths: `.agents/skills/request-monorepo-revision/SKILL.md`, `.agents/skills/request-monorepo-revision/agents/openai.yaml`, `.agents/skills/orchestrate-monorepo-work/SKILL.md`, `AGENTS.md`, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, `docs/workflow/WORKFLOW_OVERVIEW.md`
- Inputs: Acceptance criteria 3–5; the selected revision-request design; the
  workflow tests from Task 3; existing skill frontmatter and agent metadata.
- Output: A write-capable `request-monorepo-revision` skill that accepts only a
  direct user request to revise the active current contract or plan, validates
  the current state, records the next `revision-request.md` revision with the
  exact target and user wording, and changes only the `NEXT.md` pipeline step
  to the validated owner. The read-only router names this stage only for that
  direct intent. Repository instructions and normative workflow documentation
  list the intent-triggered stage, its artifact, its `--current` validation,
  and its non-product mutation boundary.
- Test command: `node --test scripts/validate-living-workflow.test.mjs`
- Expected result: The structural fixture accepts the complete new skill and
  documentation contract; the workflow validator rejects a missing or
  incorrectly identified revision-request skill.
- Rollback: Not applicable.

### 5. Make contract and plan revisions executable through their owning skills

- Paths: `.agents/skills/scope-monorepo-change/SKILL.md`, `.agents/skills/plan-monorepo-change/SKILL.md`, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, `docs/workflow/WORKFLOW_OVERVIEW.md`, `AGENTS.md`
- Inputs: Acceptance criteria 6–8; valid request routes from Task 2; workflow
  test requirements from Task 3; the revision-request design.
- Output: Scope supports a current `contract` revision request by archiving
  every existing downstream current artifact in reverse dependency order
  (`reconciliation`, `verification`, `implementation`, `approval`, `plan`),
  then the current contract and consumed request, with only `Status:` changed
  to `superseded`; it writes `contract@N+1` using current request/context
  prerequisites and routes to planning. Plan supports a current `plan`
  revision request by archiving existing downstream current artifacts in
  reverse dependency order (`reconciliation`, `verification`,
  `implementation`, `approval`), then the plan and consumed request; it writes
  `plan@N+1` against the current contract and routes to fresh explicit
  approval. Both skills retain their revision-one forward behavior and stop on
  invalid preflight state.
- Test command: `pnpm test:workflow`
- Expected result: Both workflow test suites exit `0`; disposable lifecycle
  coverage proves the target route, preserved superseded archives, incremented
  contract or plan, removed invalidated current artifacts, and the mandatory
  fresh-approval stop.
- Rollback: Not applicable.

### 6. Run aggregate checks and record the implementation handoff without advancing verification

- Paths: `docs/work-items/2026-07-14-monorepo-work-item-pipeline-review-repairs/implementation-report.md`
- Inputs: Acceptance criterion 9; all changed source, tests, skills, and
  workflow documentation from Tasks 1–5; actual aggregate command output.
- Output: A ready implementation report with the exact changed paths,
  red-to-green test evidence, aggregate validation output, known preserved
  dirty-worktree boundaries, and the validator-confirmed handoff to
  `verify-monorepo-change`. It does not create verification, reconciliation,
  approval, release, or Git-history artifacts.
- Test command: `pnpm check`
- Expected result: Each command exits `0`; the active work item validates for
  `verify-monorepo-change` after the implementation report is written; the
  diff check reports no whitespace errors.
- Rollback: Not applicable.

## Affected paths

- Create: `.agents/skills/request-monorepo-revision/SKILL.md`, `.agents/skills/request-monorepo-revision/agents/openai.yaml`, `docs/work-items/2026-07-14-monorepo-work-item-pipeline-review-repairs/implementation-report.md`.
- Modify: `scripts/validate-monorepo-work-item.mjs`, `scripts/validate-monorepo-work-item.test.mjs`, `scripts/validate-living-workflow.mjs`, `scripts/validate-living-workflow.test.mjs`, `package.json`, `.agents/skills/orchestrate-monorepo-work/SKILL.md`, `.agents/skills/scope-monorepo-change/SKILL.md`, `.agents/skills/plan-monorepo-change/SKILL.md`, `AGENTS.md`, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, `docs/workflow/WORKFLOW_OVERVIEW.md`.
- Delete: Not applicable.

## Verification commands

- `node --test scripts/validate-monorepo-work-item.test.mjs` — focused
  active-registration and revision-request lifecycle tests exit `0`.
- `node --test scripts/validate-living-workflow.test.mjs` — workflow skill and
  root-command structure tests exit `0`.
- `pnpm test:workflow` — both workflow suites exit `0`.
- `pnpm check` — repository formatting, linting, typechecking, and configured
  tests exit `0`.
- `pnpm validate:workflow` — living-workflow validation and current active
  registration validation exit `0`.
- `node scripts/validate-living-workflow.mjs` and `node scripts/validate-monorepo-work-item.mjs --current --json` — both validators exit `0`, with
  the current work item routed to `verify-monorepo-change` after the report.
- `git diff --check` — exits `0` without whitespace errors.

## Rollback

Not applicable. The planned changes are repository-local source, tests, skill
instructions, workflow documentation, and a normal work-item implementation
report; they do not perform stateful product, distribution, consumer-data, or
Git-history mutations.
