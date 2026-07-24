Work item: 2026-07-14-monorepo-work-item-pipeline-review-repairs
Artifact: contract
Revision: 2
Prerequisites: request@1,context@1
Status: ready

# Goal

Make active-registration validation and contract/plan revision recovery
reachable and operable under the approved Monorepo Work-Item Pipeline contract.

## Non-goals

- Change public CLI behavior, persisted schemas, package/distribution
  direction, source retirement, or consumer workflows.
- Repair previously resolved failed-verification recovery behavior.
- Modify unrelated feature-resume planning artifacts or pre-existing pipeline
  changes outside the Task 13 review findings and approved revision-entry
  expansion.
- Commit, push, release, pack, publish, or globally install any package.

## Hard walls

- Do not commit or push without separate user direction.
- Do not invoke `features-cli`, inspect or mutate consumer `.scratch` state,
  or perform release, packing, publication, global installation, or source
  deletion within this work.
- Preserve the source rollback copy, user data, LF checkout policy, and
  approved Windows/Linux target.
- Do not change public behavior or persisted schemas without a separate user
  approval decision.
- Keep all work-item lifecycle tests isolated in disposable temporary roots;
  do not create or mutate a real workflow fixture outside this active work
  item.

## Acceptance criteria

1. The work-item validator accepts `--work-item none` only when `NEXT.md`
   contains exactly one explicit `Active work item: none` field and exactly one
   explicit `Pipeline step: none` field; missing, partial, duplicate,
   malformed, or inconsistent registration is invalid structural state.
2. Disposable validator tests prove the missing-registration rejection,
   explicit inactive state, active current-route validation, and conflicting
   registrations.
3. A `revision-request.md` control artifact records a direct user request to
   revise the active current contract or plan, has a complete revision-aware
   header, names exactly one current `contract` or `plan` prerequisite, and is
   rejected when malformed, stale, duplicate, or unsupported.
4. `request-monorepo-revision` records the revision request without changing
   product state and changes `NEXT.md` only to the target owner; the router
   selects that stage only for a direct user revision request.
5. A valid current revision request makes the validator route to its owner:
   contract requests to `scope-monorepo-change` and plan requests to
   `plan-monorepo-change`.
6. Scoping consumes a contract request by archiving invalidated downstream
   current artifacts in reverse dependency order, archiving the current
   contract and request, writing the next contract revision, and routing to
   planning.
7. Planning consumes a plan request by archiving invalidated downstream
   current artifacts in reverse dependency order, archiving the current plan
   and request, writing the next plan revision, and routing to fresh explicit
   approval.
8. Each archive preserves artifact bytes except for changing the header status
   to `superseded`; approval, implementation, verification, and reconciliation
   are invalidated as applicable, and a revised plan requires explicit user
   approval before implementation.
9. Focused validator and workflow checks, the full repository check, both
   workflow validators, and whitespace validation pass after the repairs.

## Test seams

- Child-process validator JSON and exit status against temporary roots with
  missing, partial, explicit inactive, duplicate, malformed, and inconsistent
  active-registration blocks.
- Temporary work-item revision trees covering request creation, target
  validation, contract and plan archive/increment, prerequisite integrity,
  downstream invalidation, and route transitions.
- Workflow-skill structure and content checks for revision-request ownership,
  routing, and archive behavior.
- Repository aggregate commands that exercise formatting, linting,
  typechecking, package tests, workflow tests, and both validators.

## Verification

- `node --test scripts/validate-monorepo-work-item.test.mjs` proves validator
  and disposable revision-request lifecycle seams and exits `0`.
- `pnpm test:workflow` proves both workflow validator suites and exits `0`.
- `node scripts/validate-living-workflow.mjs` and
  `node scripts/validate-monorepo-work-item.mjs --current --json` validate
  workflow structure and the active work-item route.
- `pnpm check`, `pnpm validate:workflow`, and `git diff --check` exit `0` and
  leave only intentional pipeline changes, this active work item, Task 13
  evidence, and separately approved preflight artifacts.

## Approval required

Yes. This revised contract requires a new implementation plan and explicit
approval before implementation resumes. The user directly approved the
revision-request design on 2026-07-14; no public behavior, persisted schema,
distribution, deletion, cost, security, privacy, or user-data decision is
introduced.
