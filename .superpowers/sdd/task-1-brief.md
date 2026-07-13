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
