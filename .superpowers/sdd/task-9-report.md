# Task 9 Report: `verify-monorepo-change`

## Scope

Created only the Task 9 verification-stage skill and its OpenAI metadata. The
skill consumes the active contract, plan, implementation report, and worktree;
it records `verification.md` and advances only the pipeline-step value to the
validator-selected repair or reconciliation route.

## RED

A fresh no-guidance control refused a premature pass and mapped criteria to
evidence, but then proposed performing reconciliation and updating the
canonical plan after successful verification. The new skill makes that
boundary explicit: it writes observed `verification.md` evidence only; passed
evidence routes only to `reconcile-monorepo-change`, while failed evidence
routes only to `implement-monorepo-change` and must not update `NEXT.md` or the
canonical plan except for its required failed-route pipeline step.

## GREEN

A forward-use scenario applied the completed skill to a ready implementation:
it required the `verify-monorepo-change` preflight route; built a matrix from
every contract criterion, seam, and stated verification requirement; reran
focused and applicable package/root checks; inspected changed paths; ran
`git diff --check`; and recorded commands, exit codes, observations, status,
and failures in the revision-one verification template. It selected only
`reconcile-monorepo-change` after fully passed evidence and only
`implement-monorepo-change` after a failure. It did not reconcile or update
the canonical plan.

The disposable current-validator fixture used matching revision-one request,
context, contract, plan, digest-bound approval, implementation report,
verification record, and active registration. It proved both branches and
removed both temporary fixture roots after execution.

## Focused verification commands/results

- `node C:\\Users\\jimzord12\\AppData\\Local\\Temp\\task-9-validator-routes.mjs C:\\Users\\jimzord12\\Documents\\GitHub\\ai-arsenal\\scripts\\validate-monorepo-work-item.mjs`
  - Exit 0. The disposable fixture reported `passed` ->
    `reconcile-monorepo-change` and `failed` ->
    `implement-monorepo-change`, with the validator's required repair blocker.
- `node --test scripts/validate-monorepo-work-item.test.mjs`
  - Exit 0. The current validator suite passed, including its failed
    verification re-entry coverage.
- `node scripts/validate-living-workflow.mjs`
  - Exit 0. The changed workflow artifact remained structurally valid.
- `pnpm format:check`
  - Exit 0. Prettier reported all matched files formatted.
- `git diff --check`
  - Exit 0. No whitespace errors were reported.

## Decisions

- Require a fresh matrix and observed results rather than treating the
  implementation report as verification evidence.
- Treat every failed, missing, or out-of-contract requirement as durable failed
  evidence and return only to the approved implementation boundary.
- The task brief's failed-route wording conflicted with the pipeline's
  validator-required active step. The user resolved it directly: write
  `Status: failed`, change only the existing `NEXT.md` pipeline-step value to
  `implement-monorepo-change`, never edit the canonical plan, and require the
  valid failed-validator route.
- Reserve all canonical-plan and reconciliation work for the later
  `reconcile-monorepo-change` stage.

## Changed paths

- `.agents/skills/verify-monorepo-change/SKILL.md`
- `.agents/skills/verify-monorepo-change/agents/openai.yaml`
- `.superpowers/sdd/task-9-report.md`

## Concerns

- None.
